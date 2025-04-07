
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Upload } from "lucide-react";

interface UserProfile {
  name: string;
  role: string;
  avatarUrl: string | null;
}

const Account = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "John Doe",
    role: "Freelancer",
    avatarUrl: null
  });
  
  const [isUploading, setIsUploading] = useState(false);

  // Load profile from localStorage on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        setUserProfile(parsedProfile);
      } catch (e) {
        console.error('Error parsing user profile from localStorage:', e);
      }
    }
  }, []);

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Maximum size is 5MB.");
      return;
    }

    setIsUploading(true);

    // Convert the file to base64 for storage
    const reader = new FileReader();
    reader.onload = () => {
      setUserProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
      setIsUploading(false);
    };
    reader.onerror = () => {
      toast.error("Failed to process image.");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUserProfile(prev => ({ ...prev, avatarUrl: null }));
  };

  const handleSaveSettings = () => {
    // Save to localStorage
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    toast.success("Profile updated successfully");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            Manage your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24 border border-border">
                {userProfile.avatarUrl ? (
                  <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} />
                ) : (
                  <AvatarFallback className="bg-success/20 text-success text-xl font-medium">
                    {getInitials(userProfile.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="relative"
                  disabled={isUploading}
                >
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                  <Upload className="mr-1 h-4 w-4" />
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
                
                {userProfile.avatarUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRemoveImage}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={userProfile.name}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role (optional)</Label>
                <Input
                  id="role"
                  name="role"
                  value={userProfile.role}
                  onChange={handleChange}
                  placeholder="e.g. Freelancer, Developer, Designer"
                />
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleSaveSettings}
            className="bg-success hover:bg-success/90 text-success-foreground mt-4"
          >
            Save Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Account;
