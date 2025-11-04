
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, BookOpen, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const events = [
    { id: 1, title: "Estudi Cardiologia", date: "2024-01-15", time: "10:00", subject: "Cardiologia" },
    { id: 2, title: "Repàs Neurologia", date: "2024-01-15", time: "15:00", subject: "Neurologia" },
    { id: 3, title: "Test MCQ Pediatria", date: "2024-01-16", time: "09:00", subject: "Pediatria" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Calendari d'Estudi</h1>
          <p className="text-muted-foreground mt-2">
            Planifica les teves sessions d'estudi
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button data-testid="button-new-event">
              <Plus className="h-4 w-4 mr-2" />
              Nova Sessió
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Planificar Sessió d'Estudi</DialogTitle>
              <DialogDescription>
                Afegeix una nova sessió al teu calendari
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="event-title">Títol</Label>
                <Input id="event-title" placeholder="Ex: Repàs Cardiologia" data-testid="input-event-title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event-date">Data</Label>
                  <Input id="event-date" type="date" data-testid="input-event-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-time">Hora</Label>
                  <Input id="event-time" type="time" data-testid="input-event-time" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-subject">Assignatura</Label>
                <select
                  id="event-subject"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2"
                  data-testid="select-event-subject"
                >
                  <option>Cardiologia</option>
                  <option>Neurologia</option>
                  <option>Pediatria</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-notes">Notes</Label>
                <Textarea id="event-notes" placeholder="Detalls addicionals..." data-testid="textarea-event-notes" />
              </div>
              <Button className="w-full" data-testid="button-save-event">
                Guardar Sessió
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Gener 2024
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-center">
              {['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'].map(day => (
                <div key={day} className="font-semibold text-sm text-muted-foreground p-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <button
                  key={day}
                  className="aspect-square p-2 rounded-lg hover:bg-accent transition-colors text-sm"
                  data-testid={`calendar-day-${day}`}
                >
                  {day}
                  {day === 15 && <div className="w-1 h-1 bg-primary rounded-full mx-auto mt-1" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Properes Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <p className="font-medium">{event.title}</p>
                  <Badge variant="outline">{event.subject}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {event.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.time}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
