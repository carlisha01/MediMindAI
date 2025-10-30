import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-semibold mb-2">404</h1>
        <h2 className="text-xl font-medium mb-4">Pàgina no trobada</h2>
        <p className="text-muted-foreground mb-8">
          Ho sentim, la pàgina que cerques no existeix o ha estat moguda.
        </p>
        <Link href="/">
          <Button data-testid="button-go-home">
            Tornar al Tauler
          </Button>
        </Link>
      </div>
    </div>
  );
}
