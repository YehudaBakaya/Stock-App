    import { useState } from "react";
    import { motion } from "framer-motion";
    import { User, Settings, Shield, Bell, Moon, Sun, Globe } from "lucide-react";

    import Button from "../components/ui/Button";
    import Card from "../components/ui/Card";
    import Input from "../components/ui/Input";
    import Switch from "../components/ui/Switch";

    export default function Profile() {
    const [darkMode, setDarkMode] = useState(false);

    const [profile, setProfile] = useState({
        name: "John Trader",
        email: "john@trader.com",
        phone: "+1 (555) 123-4567",
        memberSince: "2023-01-15",
    });

    const [settings, setSettings] = useState({
        notifications: true,
        emailAlerts: true,
        priceAlerts: true,
        newsUpdates: false,
        twoFactor: true,
    });

    const toggleSetting = (key) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="min-h-screen bg-gray-950 p-6 text-white">
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Header */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-4xl font-bold mb-1">Profile & Settings</h1>
            <p className="text-gray-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Manage your account
            </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">

            {/* Profile */}
            <Card>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <User className="w-5 h-5" /> Profile Information
                </h2>

                <Input
                label="Full Name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
                <Input
                label="Email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
                <Input
                label="Phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
                <Input
                label="Member Since"
                value={new Date(profile.memberSince).toLocaleDateString()}
                disabled
                />

                <Button className="mt-4 w-full">Update Profile</Button>
            </Card>

            {/* Settings */}
            <div className="space-y-6">

                {/* App */}
                <Card>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5" /> App Settings
                </h2>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                    {darkMode ? <Moon /> : <Sun />}
                    Dark Mode
                    </div>
                    <Switch onClick={() => setDarkMode(!darkMode)} />
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                    <Globe /> Language
                    </div>
                    <span className="text-gray-400">English</span>
                </div>
                </Card>

                {/* Notifications */}
                <Card>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5" /> Notifications
                </h2>

                {Object.keys(settings).map((key) => (
                    <div key={key} className="flex items-center justify-between mb-3">
                    <span className="capitalize">{key}</span>
                    <Switch onClick={() => toggleSetting(key)} />
                    </div>
                ))}
                </Card>

                {/* Security */}
                <Card>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5" /> Security
                </h2>

                <Button variant="outline" className="w-full mb-2">
                    Change Password
                </Button>
                <Button variant="outline" className="w-full">
                    Manage API Keys
                </Button>
                </Card>

            </div>
            </div>
        </div>
        </div>
    );
    }
