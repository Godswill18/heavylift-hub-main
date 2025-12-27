import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, User, Mail, Phone, MapPin, Building, Calendar, Shield, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileError) throw profileError;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", id)
        .single();

      return {
        ...profile,
        role: roleData?.role || "contractor",
      };
    },
    enabled: !!id,
  });

  const { data: userStats } = useQuery({
    queryKey: ["admin-user-stats", id],
    queryFn: async () => {
      const [equipmentResult, bookingsAsContractor, bookingsAsOwner] = await Promise.all([
        supabase.from("equipment").select("id", { count: "exact" }).eq("owner_id", id!),
        supabase.from("bookings").select("id", { count: "exact" }).eq("contractor_id", id!),
        supabase.from("bookings").select("id", { count: "exact" }).eq("owner_id", id!),
      ]);

      return {
        equipmentCount: equipmentResult.count || 0,
        bookingsAsContractor: bookingsAsContractor.count || 0,
        bookingsAsOwner: bookingsAsOwner.count || 0,
      };
    },
    enabled: !!id,
  });

  const updateVerificationMutation = useMutation({
    mutationFn: async (newStatus: "pending" | "verified" | "rejected") => {
      const { error } = await supabase
        .from("profiles")
        .update({ verification_status: newStatus })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Verification status updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update verification status: " + error.message);
    },
  });

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Admin</Badge>;
      case "owner":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Owner</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Contractor</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="outline" onClick={() => navigate("/admin/users")} className="mt-4">
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{user.full_name || "Unknown User"}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getVerificationBadge(user.verification_status || "pending")}
          {getRoleBadge(user.role)}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{user.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{user.city || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{user.company_name || "Not a company"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{format(new Date(user.created_at), "PPP")}</p>
                </div>
              </div>
            </div>
            {user.bio && (
              <div className="pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Bio</p>
                <p className="text-sm">{user.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Controls */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verification Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Current Status</p>
              {getVerificationBadge(user.verification_status || "pending")}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Update Verification Status</p>
              <Select
                value={selectedStatus || user.verification_status || "pending"}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => updateVerificationMutation.mutate(selectedStatus as "pending" | "verified" | "rejected")}
                disabled={!selectedStatus || selectedStatus === user.verification_status || updateVerificationMutation.isPending}
                className="w-full"
              >
                {updateVerificationMutation.isPending ? "Updating..." : "Update Status"}
              </Button>
            </div>

            {/* User Stats */}
            {userStats && (
              <div className="pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-3">User Statistics</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{userStats.equipmentCount}</p>
                    <p className="text-xs text-muted-foreground">Equipment</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{userStats.bookingsAsContractor}</p>
                    <p className="text-xs text-muted-foreground">Rentals</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{userStats.bookingsAsOwner}</p>
                    <p className="text-xs text-muted-foreground">Lent Out</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDetail;