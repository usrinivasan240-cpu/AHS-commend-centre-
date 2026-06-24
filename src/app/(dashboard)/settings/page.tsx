"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Building2,
  Palette,
  Bell,
  Plug,
  Shield,
  Camera,
  Save,
  Key,
  Monitor,
  Smartphone,
  Trash2,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const integrations = [
  {
    name: "Google Workspace",
    description: "Calendar, Drive, and Gmail integration",
    connected: true,
    icon: "G",
    color: "bg-blue-500/10 text-blue-400",
  },
  {
    name: "Slack",
    description: "Team messaging and notifications",
    connected: true,
    icon: "S",
    color: "bg-purple-500/10 text-purple-400",
  },
  {
    name: "GitHub",
    description: "Repository and CI/CD integration",
    connected: false,
    icon: "GH",
    color: "bg-zinc-500/10 text-zinc-400",
  },
  {
    name: "WhatsApp Business",
    description: "Client communication via WhatsApp",
    connected: false,
    icon: "WA",
    color: "bg-emerald-500/10 text-emerald-400",
  },
];

const sessions = [
  {
    id: "1",
    device: "Chrome on Windows",
    ip: "192.168.1.100",
    lastActive: "Active now",
    current: true,
  },
  {
    id: "2",
    device: "Safari on macOS",
    ip: "10.0.0.52",
    lastActive: "2 hours ago",
    current: false,
  },
  {
    id: "3",
    device: "Firefox on Ubuntu",
    ip: "172.16.0.10",
    lastActive: "1 day ago",
    current: false,
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState({
    name: "Sri Admin",
    email: "sriadmin@ahs.com",
    role: "Super Admin",
    bio: "Founder & CEO of AHS. Building the future of startup operations.",
  });

  const [company, setCompany] = useState({
    name: "AHS Technologies",
    address: "123 Innovation Drive, Chennai, Tamil Nadu 600001",
    phone: "+91 44 1234 5678",
    email: "hello@ahs.dev",
    gst: "33AABCA1234F1Z5",
  });

  const [branding, setBranding] = useState({
    tagline: "One Brain. Multiple Systems. Unlimited Growth.",
    primaryColor: "#0066ff",
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailProject: true,
    emailAssessment: true,
    emailLead: false,
    emailTeam: true,
    emailAssignment: true,
    emailSystem: true,
    whatsappProject: false,
    whatsappAssessment: false,
    whatsappLead: true,
    whatsappTeam: false,
    whatsappAssignment: true,
    whatsappSystem: true,
    inAppProject: true,
    inAppAssessment: true,
    inAppLead: true,
    inAppTeam: true,
    inAppAssignment: true,
    inAppSystem: true,
  });

  const [twoFactor, setTwoFactor] = useState(false);

  const updateNotifPref = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Settings <span className="gradient-text">Configuration</span>
        </h1>
        <p className="mt-1 text-muted">
          Manage your account, company, and system preferences
        </p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="h-3.5 w-3.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Company
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-1.5">
              <Plug className="h-3.5 w-3.5" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                      AK
                    </div>
                    <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted hover:text-white transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {profile.name}
                    </h3>
                    <p className="text-sm text-muted">{profile.role}</p>
                    <p className="text-xs text-muted mt-1">
                      Click the camera icon to upload a new avatar
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value={profile.role} disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button className="gap-2" onClick={() => alert('Profile saved!')}>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>
                  Manage your company information and legal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={company.name}
                      onChange={(e) =>
                        setCompany({ ...company, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Company Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={company.email}
                      onChange={(e) =>
                        setCompany({ ...company, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Phone Number</Label>
                    <Input
                      id="companyPhone"
                      value={company.phone}
                      onChange={(e) =>
                        setCompany({ ...company, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      value={company.gst}
                      onChange={(e) =>
                        setCompany({ ...company, gst: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Company Address</Label>
                  <Textarea
                    id="address"
                    value={company.address}
                    onChange={(e) =>
                      setCompany({ ...company, address: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div className="flex justify-end">
                  <Button className="gap-2" onClick={() => alert('Profile saved!')}>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Branding & Identity</CardTitle>
                <CardDescription>
                  Customize your company branding and visual identity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-border bg-card-hover/50 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="text-center">
                      <Camera className="h-6 w-6 text-muted mx-auto" />
                      <span className="text-[10px] text-muted mt-1 block">
                        Upload Logo
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">
                      Company Logo
                    </h4>
                    <p className="text-xs text-muted mt-1">
                      Recommended: 256x256px, PNG or SVG format
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-1.5"
                      onClick={() => alert('File picker would open')}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Choose File
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="tagline">Company Tagline</Label>
                  <Input
                    id="tagline"
                    value={branding.tagline}
                    onChange={(e) =>
                      setBranding({ ...branding, tagline: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Primary Brand Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) =>
                        setBranding({
                          ...branding,
                          primaryColor: e.target.value,
                        })
                      }
                      className="h-10 w-10 rounded-md border border-border cursor-pointer"
                    />
                    <Input
                      value={branding.primaryColor}
                      onChange={(e) =>
                        setBranding({
                          ...branding,
                          primaryColor: e.target.value,
                        })
                      }
                      className="w-32"
                    />
                    <div className="flex gap-2">
                      {["#0066ff", "#00d9ff", "#7fff00", "#10b981", "#f59e0b"].map(
                        (color) => (
                          <button
                            key={color}
                            className={cn(
                              "h-8 w-8 rounded-full border-2 transition-all",
                              branding.primaryColor === color
                                ? "border-white scale-110"
                                : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() =>
                              setBranding({ ...branding, primaryColor: color })
                            }
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="gap-2" onClick={() => alert('Profile saved!')}>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how and where you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-3 text-left font-medium text-muted">
                          Notification Type
                        </th>
                        <th className="pb-3 text-center font-medium text-muted">
                          <div className="flex items-center justify-center gap-1.5">
                            <Bell className="h-3.5 w-3.5" />
                            In-App
                          </div>
                        </th>
                        <th className="pb-3 text-center font-medium text-muted">
                          <div className="flex items-center justify-center gap-1.5">
                            <Bell className="h-3.5 w-3.5" />
                            Email
                          </div>
                        </th>
                        <th className="pb-3 text-center font-medium text-muted">
                          <div className="flex items-center justify-center gap-1.5">
                            <Smartphone className="h-3.5 w-3.5" />
                            WhatsApp
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {(
                        [
                          {
                            label: "Project Updates",
                            inApp: "inAppProject",
                            email: "emailProject",
                            whatsapp: "whatsappProject",
                          },
                          {
                            label: "Assessment Alerts",
                            inApp: "inAppAssessment",
                            email: "emailAssessment",
                            whatsapp: "whatsappAssessment",
                          },
                          {
                            label: "Lead Notifications",
                            inApp: "inAppLead",
                            email: "emailLead",
                            whatsapp: "whatsappLead",
                          },
                          {
                            label: "Team Activity",
                            inApp: "inAppTeam",
                            email: "emailTeam",
                            whatsapp: "whatsappTeam",
                          },
                          {
                            label: "Assignment Reminders",
                            inApp: "inAppAssignment",
                            email: "emailAssignment",
                            whatsapp: "whatsappAssignment",
                          },
                          {
                            label: "System Alerts",
                            inApp: "inAppSystem",
                            email: "emailSystem",
                            whatsapp: "whatsappSystem",
                          },
                        ] as const
                      ).map((item) => (
                        <tr
                          key={item.label}
                          className="hover:bg-card-hover/30 transition-colors"
                        >
                          <td className="py-3.5 font-medium text-white">
                            {item.label}
                          </td>
                          <td className="py-3.5 text-center">
                            <Switch
                              checked={
                                notificationPrefs[
                                  item.inApp as keyof typeof notificationPrefs
                                ]
                              }
                              onCheckedChange={() =>
                                updateNotifPref(
                                  item.inApp as keyof typeof notificationPrefs
                                )
                              }
                            />
                          </td>
                          <td className="py-3.5 text-center">
                            <Switch
                              checked={
                                notificationPrefs[
                                  item.email as keyof typeof notificationPrefs
                                ]
                              }
                              onCheckedChange={() =>
                                updateNotifPref(
                                  item.email as keyof typeof notificationPrefs
                                )
                              }
                            />
                          </td>
                          <td className="py-3.5 text-center">
                            <Switch
                              checked={
                                notificationPrefs[
                                  item.whatsapp as keyof typeof notificationPrefs
                                ]
                              }
                              onCheckedChange={() =>
                                updateNotifPref(
                                  item.whatsapp as keyof typeof notificationPrefs
                                )
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button className="gap-2" onClick={() => alert('Preferences saved!')}>
                    <Save className="h-4 w-4" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="mt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {integrations.map((integration) => (
                <Card key={integration.name} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold",
                          integration.color
                        )}
                      >
                        {integration.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white">
                            {integration.name}
                          </h3>
                          <Badge
                            variant={
                              integration.connected ? "success" : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {integration.connected ? "Connected" : "Not Connected"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          {integration.description}
                        </p>
                        <div className="mt-4">
                          {integration.connected ? (
                            <Button
                              variant="danger"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => alert(`Disconnecting ${integration.name}...`)}
                            >
                              Disconnect
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => alert(`Connecting ${integration.name}...`)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6">
            <div className="space-y-6">
              {/* Two-Factor */}
              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">
                          {twoFactor
                            ? "Two-Factor Authentication is enabled"
                            : "Two-Factor Authentication is disabled"}
                        </h4>
                        <p className="text-xs text-muted mt-0.5">
                          {twoFactor
                            ? "Your account is protected with 2FA."
                            : "Enable 2FA to secure your account."}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={twoFactor}
                      onCheckedChange={setTwoFactor}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password regularly for better security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">
                        Current Password
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="default" className="gap-2" onClick={() => alert('Password updated!')}>
                      <Key className="h-4 w-4" />
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Active Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>
                    Manage and revoke active sessions on your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-card-hover/30"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10">
                            <Monitor className="h-5 w-5 text-muted" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-white">
                              {session.device}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted">
                                IP: {session.ip}
                              </span>
                              <span className="text-xs text-muted">•</span>
                              <span className="text-xs text-muted">
                                {session.lastActive}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.current ? (
                            <Badge variant="success" className="text-[10px]">
                              Current
                            </Badge>
                          ) : (
                            <Button
                              variant="danger"
                              size="sm"
                              className="gap-1"
                              onClick={() => alert('Session revoked!')}
                            >
                              <Trash2 className="h-3 w-3" />
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
