
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
import { Pencil, Trash, Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";


interface TeachersTableProps {
    teachers: Teacher[];
    onViewTeacher: (teacher: Teacher) => void;
    onEditTeacher: (teacher: Teacher) => void;
    onDeleteTeacher: (teacher: Teacher) => void;
}

export function TeachersTable({ teachers, onViewTeacher, onEditTeacher, onDeleteTeacher }: TeachersTableProps) {
    
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
                <TooltipProvider>
                 <Table>
                    {teachers.length === 0 && <TableCaption>No teachers found.</TableCaption>}
                    <TableHeader>
                        <TableRow>
                            <TableHead>Teacher</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                            <TableCell className="text-right">
                               <div className="flex justify-end gap-2">
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                             <Button variant="outline" size="icon" onClick={() => onViewTeacher(teacher)}>
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">View Details</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>View Details</p>
                                        </TooltipContent>
                                    </Tooltip>
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                             <Button variant="outline" size="icon" onClick={() => onEditTeacher(teacher)}>
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit Details</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Edit Details</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                             <Button variant="destructive" size="icon" onClick={() => onDeleteTeacher(teacher)}>
                                                <Trash className="h-4 w-4" />
                                                <span className="sr-only">Delete Teacher</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Delete Teacher</p>
                                        </TooltipContent>
                                    </Tooltip>
                               </div>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </TooltipProvider>
            </CardContent>
        </Card>
    )
}
