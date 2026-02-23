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
import { Pencil, Trash, Eye, Mail, Hash } from "lucide-react";
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
        <Card className="shadow-md border-none overflow-hidden bg-card/50">
            {(title || description) && (
                <CardHeader className="pb-4 bg-muted/10">
                    {title && <CardTitle className="font-headline text-2xl text-primary">{title}</CardTitle>}
                    {description && <CardDescription className="text-foreground/70">{description}</CardDescription>}
                </CardHeader>
            )}
            <CardContent className="p-0">
                <TooltipProvider>
                 <Table>
                    {students.length === 0 && <TableCaption className="py-16 text-muted-foreground italic">No student records found.</TableCaption>}
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[120px] pl-6">Identity</TableHead>
                            <TableHead>Student Details</TableHead>
                            <TableHead className="hidden md:table-cell text-center">Department</TableHead>
                            <TableHead className="hidden md:table-cell text-center">Semester</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((student) => (
                        <TableRow key={student.registerNumber} className="hover:bg-muted/20 transition-colors group">
                            <TableCell className="pl-6 py-4">
                                <Avatar className="h-20 w-20 border-4 border-background shadow-xl ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                                    <AvatarImage src={student.profilePhotoUrl} alt={student.name} className="object-cover" />
                                    <AvatarFallback className="text-2xl bg-primary/5 text-primary font-black">{getInitials(student.name)}</AvatarFallback>
                                </Avatar>
                            </TableCell>
                            <TableCell>
                                <div className="grid gap-1">
                                    <div className="font-black text-xl text-foreground group-hover:text-primary transition-colors leading-tight">{student.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium opacity-80">
                                        <Mail className="h-3 w-3" />
                                        {student.email}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                        <Badge variant="outline" className="text-[10px] px-2 py-0 font-code font-black bg-background shadow-sm uppercase tracking-widest">
                                            <Hash className="h-2 w-2 mr-1" />
                                            {student.registerNumber}
                                        </Badge>
                                        <Badge variant="secondary" className="md:hidden text-[10px] px-2 py-0 uppercase font-black tracking-tighter">SEM {student.semester}</Badge>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-center">
                                <Badge variant="outline" className="uppercase font-black border-2 border-primary/20 text-primary">
                                    {student.department}
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-center">
                                <Badge variant="secondary" className="font-black px-4 py-1 text-sm shadow-inner">
                                    SEM {student.semester}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                               <div className="flex justify-end gap-1">
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-primary/10 hover:text-primary transition-all shadow-sm hover:shadow-md" onClick={() => onViewStudent(student)}>
                                                <Eye className="h-6 w-6" />
                                                <span className="sr-only">View Profile</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>View Profile</p></TooltipContent>
                                    </Tooltip>
                                   {!readOnly && onEditStudent && (
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm hover:shadow-md" onClick={() => onEditStudent(student)}>
                                                <Pencil className="h-6 w-6" />
                                                <span className="sr-only">Edit Details</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Edit Student</p></TooltipContent>
                                    </Tooltip>
                                   )}
                                    {!readOnly && onDeleteStudent && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all shadow-sm hover:shadow-md" onClick={() => onDeleteStudent(student)}>
                                                <Trash className="h-6 w-6" />
                                                <span className="sr-only">Remove Student</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Delete Record</p></TooltipContent>
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
