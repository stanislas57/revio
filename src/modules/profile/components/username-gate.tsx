import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsernameForm } from "./username-form";

/**
 * Full-page screen shown instead of the app until the user has a username. It replaces the whole
 * app shell (no navigation to the other tabs), keeping only a way to sign out.
 */
export function UsernameGate({ email }: { email: string }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
      <p className="text-lg font-bold tracking-tight">Revio</p>
      <Card>
        <CardHeader>
          <h1 className="sr-only">Choisis ton pseudo</h1>
          <CardTitle aria-hidden>Choisis ton pseudo</CardTitle>
          <CardDescription>
            Une dernière étape avant de commencer. Tes amis te trouvent grâce à ton pseudo : il est visible
            par les autres utilisateurs. Tes notes et tes matières ne le sont jamais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsernameForm />
        </CardContent>
      </Card>
      <form action="/auth/deconnexion" method="post" className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs text-muted-foreground" title={email}>
          Connecté : {email}
        </p>
        <Button type="submit" variant="ghost" className="h-11">
          <LogOut className="size-4" aria-hidden />
          Se déconnecter
        </Button>
      </form>
    </main>
  );
}
