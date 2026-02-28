"use client";

import { usePlanningStore } from "@/stores/use-planning-store";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Globe, User } from "lucide-react";

export function CredentialsForm() {
  const { credentials, setCredentials } = usePlanningStore();

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="h-4 w-4 text-primary" />
          Credentials
        </CardTitle>
        <CardDescription>
          Provide login details for the target site. These are encrypted and
          only used during execution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="cred-url" className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            Target URL
          </label>
          <Input
            id="cred-url"
            type="url"
            placeholder="https://staging.example.com"
            value={credentials.url}
            onChange={(e) => setCredentials({ url: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="cred-username" className="flex items-center gap-2 text-sm font-medium">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            Username
          </label>
          <Input
            id="cred-username"
            placeholder="test@example.com"
            value={credentials.username}
            onChange={(e) => setCredentials({ username: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="cred-password" className="flex items-center gap-2 text-sm font-medium">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            Password
          </label>
          <Input
            id="cred-password"
            type="password"
            placeholder="Enter password"
            value={credentials.password}
            onChange={(e) => setCredentials({ password: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
