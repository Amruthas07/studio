
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
import type { Student } from "@/lib/types";
import { Button } from "../ui/button";
import { Pencil, Trash, Eye, MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";


interface StudentsTableProps {
    students: Student[];
    title: string;
    description: string;
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
        <Card className="shadow-md border-none">
            <CardHeader className="pb-2">
                <CardTitle className="font-headline text-xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                 <Table>
                    {students.length === 0 && <TableCaption className="py-10">No students found in this category.</TableCaption>}
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[80px]">Profile</TableHead>
                            <TableHead>Student Details</TableHead>
                            <TableHead className="hidden md:table-cell">Register No.</TableHead>
                            <TableHead className="hidden md:table-cell">Department</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((student) => (
                        <TableRow key={student.registerNumber} className="hover:bg-muted/20 transition-colors group">
                            <TableCell>
                                <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                                    <AvatarImage src={student.profilePhotoUrl} alt={student.name} className="object-cover" />
                                    <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">{getInitials(student.name)}</AvatarFallback>
                                </Avatar>
                            </TableCell>
                            <TableCell>
                                <div className="grid gap-0.5">
                                    <div className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{student.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <MessageCircle className="h-3 w-3" />
                                        {student.email}
                                    </div>
                                    <div className="md:hidden mt-1 flex gap-2">
                                        <Badge variant="outline" className="text-[10px] px-1 py-0">{student.registerNumber}</Badge>
                                        <Badge variant="secondary" className="text-[10px] px-1 py-0 uppercase">{student.department}</Badge>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell font-code text-muted-foreground">
                                {student.registerNumber}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <Badge variant="secondary" className="uppercase font-semibold tracking-wider text-[10px]">
                                    {student.department}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                               <div className="flex justify-end gap-1">
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => onViewStudent(student)}>
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">View</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>View Profile</p></TooltipContent>
                                    </Tooltip>
                                   {!readOnly && onEditStudent && (
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600" onClick={() => onEditStudent(student)}>
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
                                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => onDeleteStudent(student)}>
                                                <Trash className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Delete Student</p></TooltipContent>
                                    </Tooltip>
                                    )}
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
