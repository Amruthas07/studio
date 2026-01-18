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
import { Camera, Pencil, Trash } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";


interface StudentsTableProps {
    students: Student[];
    onEditStudent: (student: Student) => void;
    onEnrollFace: (student: Student) => void;
    onDeleteStudent: (student: Student) => void;
}

export function StudentsTable({ students, onEditStudent, onEnrollFace, onDeleteStudent }: StudentsTableProps) {
    
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
                <CardTitle>All Students</CardTitle>
                <CardDescription>A list of all registered students. Enroll their face for recognition.</CardDescription>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                 <Table>
                    {students.length === 0 && <TableCaption>No students have been added yet.</TableCaption>}
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Register No.</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Face Enrolled</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student) => (
                        <TableRow key={student.registerNumber}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={student.photoURL} alt={student.name} />
                                        <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-0.5">
                                        <div className="font-medium">{student.name}</div>
                                        <div className="text-xs text-muted-foreground">{student.email}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{student.registerNumber}</TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="uppercase">{student.department}</Badge>
                            </TableCell>
                            <TableCell>{student.contact}</TableCell>
                            <TableCell>
                                {student.photoURL ? (
                                    <Badge variant="default">Yes</Badge>
                                ) : (
                                    <Badge variant="destructive">No</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                               <div className="flex justify-end gap-2">
                                     <Button variant={student.photoURL ? "outline" : "default"} size="sm" onClick={() => onEnrollFace(student)}>
                                        <Camera className="mr-2 h-4 w-4" />
                                        {student.photoURL ? 'Re-enroll Face' : 'Enroll Face'}
                                    </Button>
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                             <Button variant="outline" size="icon" onClick={() => onEditStudent(student)}>
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
                                             <Button variant="destructive" size="icon" onClick={() => onDeleteStudent(student)}>
                                                <Trash className="h-4 w-4" />
                                                <span className="sr-only">Delete Student</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Delete Student</p>
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
