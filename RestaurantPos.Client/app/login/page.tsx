"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { login } from "@/lib/api";
import { UserRole } from "@/types/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChefHat, Rocket } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const { login: setAuthUser } = useAuthStore();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data = await login(username, password);

            // 1. Save to Store
            setAuthUser({
                username: data.username,
                role: data.role,
                roleName: data.roleName,
                token: data.token
            });

            // 2. Set Cookie for Middleware (simple duration)
            // Ideally use a more secure way, but for this demo standard document.cookie
            document.cookie = `auth_role=${data.role}; path=/; max-age=86400;`;
            document.cookie = `auth_token=${data.token}; path=/; max-age=86400;`;

            toast.success(`Hoşgeldin ${data.username}`);

            // 3. Redirect based on Role
            switch (data.role) {
                case UserRole.Admin:
                    router.push("/admin");
                    break;
                case UserRole.Waiter:
                    router.push("/");
                    break;
                case UserRole.Kitchen:
                    router.push("/kitchen");
                    break;
                case UserRole.Cashier:
                    router.push("/cashier");
                    break;
                default:
                    router.push("/");
            }

        } catch (err: any) {
            toast.error("Giriş Başarısız. Kullanıcı adı veya şifre yanlış.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-zinc-950 px-4">
            <Card className="w-full max-w-sm shadow-2xl border-none">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Rocket className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Giriş Yap</CardTitle>
                    <CardDescription>
                        Restoran Yönetim Sistemi
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Kullanıcı Adı</Label>
                            <Input
                                id="username"
                                placeholder="Örn: admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Şifre</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="******"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
                        </Button>

                        <div className="text-xs text-center text-slate-400 mt-4">
                            Varsayılan şifre: 1234
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
