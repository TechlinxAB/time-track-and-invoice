
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/use-permissions";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserProfile } from "@/contexts/UserContext";
import { getAvailableRoles, getRoleName } from "@/lib/permissions";
import { AlertCircle, Edit, Trash2, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'user';
  createdAt: string;
}

const UserManagement = () => {
  const { isAdmin } = usePermissions();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserListItem | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    fullName: "",
    role: "user" as "admin" | "manager" | "user",
    password: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, created_at")
        .order("role", { ascending: true })
        .order("full_name", { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        const formattedUsers = data.map((user) => ({
          id: user.id,
          email: user.email || "",
          fullName: user.full_name || "",
          role: user.role as "admin" | "manager" | "user",
          createdAt: user.created_at || "",
        }));
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserListItem) => {
    setCurrentUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: currentUser.fullName,
          role: currentUser.role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id);

      if (error) {
        throw error;
      }

      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const handleAddUser = async () => {
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // The profile should be created automatically via trigger,
      // but we'll update it with our values
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          email: newUser.email,
          full_name: newUser.fullName,
          role: newUser.role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authData.user.id);

      if (profileError) {
        throw profileError;
      }

      toast.success("User added successfully");
      setIsAddDialogOpen(false);
      setNewUser({
        email: "",
        fullName: "",
        role: "user",
        password: "",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add user");
    }
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to manage users. Please contact your administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage users and their access levels
          </CardDescription>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-success hover:bg-success/90">
          <UserPlus size={16} className="mr-2" /> Add User
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.role === "admin"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : user.role === "manager"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-green-100 text-green-800 border-green-300"
                        }
                      >
                        {getRoleName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions
            </DialogDescription>
          </DialogHeader>
          {currentUser && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="editFullName">Full Name</Label>
                <Input
                  id="editFullName"
                  value={currentUser.fullName}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, fullName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input id="editEmail" value={currentUser.email} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select
                  value={currentUser.role}
                  onValueChange={(value) =>
                    setCurrentUser({
                      ...currentUser,
                      role: value as "admin" | "manager" | "user",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Roles</SelectLabel>
                      {getAvailableRoles().map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} className="bg-success hover:bg-success/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with appropriate access level
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={newUser.fullName}
                onChange={(e) =>
                  setNewUser({ ...newUser, fullName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) =>
                  setNewUser({
                    ...newUser,
                    role: value as "admin" | "manager" | "user",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    {getAvailableRoles().map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} className="bg-success hover:bg-success/90">
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserManagement;
