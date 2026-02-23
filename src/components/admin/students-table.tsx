import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import type { Student } from "@/lib/types";
import { Button } from "../ui/button";
import { Pencil, Trash, Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface StudentsTableProps {
    students: Student[];
    title?: string;
    description?: string;
    onViewStudent: (student: Student) => void;
    onEditStudent?: (student: Student) => void;
    onDeleteStudent?: (student: Student) => void;
    readOnly?: boolean;
}

export function StudentsTable({ students, title, description, onViewStudent, onEditStudent, onDeleteStudent, readOnly = false }: StudentsTableProps) {
    
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
          return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
      };

    return (
        <Card>
            {(title || description) && (
                <CardHeader>
                    {title && <CardTitle>{title}</CardTitle>}
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
            )}
            <CardContent className="p-0">
                <TooltipProvider>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px] pl-6">Profile</TableHead>
                            <TableHead>Student Info</TableHead>
                            <TableHead className="hidden md:table-cell">Department</TableHead>
                            <TableHead className="hidden md:table-cell">Semester</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                                    No student records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            students.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((student) => (
                            <TableRow key={student.registerNumber}>
                                <TableCell className="pl-6">
                                    <Avatar className="h-12 w-12 border">
                                        <AvatarImage src={student.profilePhotoUrl} alt={student.name} className="object-cover" />
                                        <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-base">{student.name}</span>
                                        <span className="text-xs text-muted-foreground font-mono">{student.registerNumber}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <Badge variant="outline" className="uppercase">
                                        {student.department}
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <Badge variant="secondary">
                                        Sem {student.semester}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                   <div className="flex justify-end gap-2">
                                         <Tooltip>
                                            <TooltipTrigger asChild>
                                                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onViewStudent(student)}>
                                                    <Eye className="h-4 w-4" />
                                                    <span className="sr-only">View</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>View Profile</p></TooltipContent>
                                        </Tooltip>
                                       {!readOnly && onEditStudent && (
                                         <Tooltip>
                                            <TooltipTrigger asChild>
                                                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onEditStudent(student)}>
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Edit Student</p></TooltipContent>
                                        </Tooltip>
                                       )}
                                        {!readOnly && onDeleteStudent && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                 <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDeleteStudent(student)}>
                                                    <Trash className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Delete Record</p></TooltipContent>
                                        </Tooltip>
                                        )}
                                   </div>
                                </TableCell>
                            </TableRow>
                            ))
                        )}
                    </TableBody>
                 </Table>
                </TooltipProvider>
            </CardContent>
        </Card>
    )
}
