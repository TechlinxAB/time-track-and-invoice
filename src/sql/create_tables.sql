
-- Create a profiles table that extends the auth.users table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    preferences JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Add Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles"
    ON profiles
    FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create a trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    postal_code TEXT,
    city TEXT,
    country TEXT,
    vat_number TEXT,
    organization_number TEXT,
    customer_number TEXT,
    notes TEXT,
    invoice_address TEXT,
    payment_terms TEXT,
    delivery_terms TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies for clients
CREATE POLICY "Users can view their own clients"
    ON clients
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
    ON clients
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
    ON clients
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
    ON clients
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hourly_rate DECIMAL NOT NULL,
    is_fixed_price BOOLEAN NOT NULL DEFAULT false,
    fixed_price DECIMAL,
    type TEXT NOT NULL CHECK (type IN ('service', 'product')),
    account_number TEXT,
    vat_percentage DECIMAL,
    article_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies for activities
CREATE POLICY "Users can view their own activities"
    ON activities
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
    ON activities
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
    ON activities
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
    ON activities
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    duration INTEGER NOT NULL, -- duration in minutes
    description TEXT,
    billable BOOLEAN NOT NULL DEFAULT true,
    invoiced BOOLEAN NOT NULL DEFAULT false,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('service', 'product')),
    quantity DECIMAL,
    unit_price DECIMAL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for time_entries
CREATE POLICY "Users can view their own time_entries"
    ON time_entries
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own time_entries"
    ON time_entries
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time_entries"
    ON time_entries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time_entries"
    ON time_entries
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    subtotal DECIMAL NOT NULL,
    tax DECIMAL NOT NULL,
    total DECIMAL NOT NULL,
    notes TEXT,
    terms_and_conditions TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Users can view their own invoices"
    ON invoices
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
    ON invoices
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
    ON invoices
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
    ON invoices
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL NOT NULL,
    unit_price DECIMAL NOT NULL,
    tax_rate DECIMAL NOT NULL,
    amount DECIMAL NOT NULL,
    time_entry_id UUID REFERENCES time_entries(id),
    activity_id UUID REFERENCES activities(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies for invoice_items based on the parent invoice
CREATE POLICY "Users can view their own invoice_items"
    ON invoice_items
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM invoices
        WHERE invoices.id = invoice_id AND invoices.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own invoice_items"
    ON invoice_items
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM invoices
        WHERE invoices.id = invoice_id AND invoices.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own invoice_items"
    ON invoice_items
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM invoices
        WHERE invoices.id = invoice_id AND invoices.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own invoice_items"
    ON invoice_items
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM invoices
        WHERE invoices.id = invoice_id AND invoices.user_id = auth.uid()
    ));
