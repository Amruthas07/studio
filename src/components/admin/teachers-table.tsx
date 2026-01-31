
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import type { Teacher } from "@/lib/types";
import { Button } from "../ui/button";
import { Pencil, Trash } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";


interface TeachersTableProps {
    teachers: Teacher[];
}

export function TeachersTable({ teachers }: TeachersTableProps) {
    
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
          return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
      };

    return (
        <Card>
            <CardHeader>
                <CardTitle>All Teachers</CardTitle>
                <CardDescription>A list of all registered teachers.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    {teachers.length === 0 && <TableCaption>No teachers found.</TableCaption>}
                    <TableHeader>
                        <TableRow>
                            <TableHead>Teacher</TableHead>
                            <TableHead>Department</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teachers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((teacher) => (
                        <TableRow key={teacher.teacherId}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={teacher.profilePhotoUrl} alt={teacher.name} />
                                        <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-0.5">
                                        <div className="font-medium">{teacher.name}</div>
                                        <div className="text-xs text-muted-foreground">{teacher.email}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="uppercase">{teacher.department}</Badge>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
