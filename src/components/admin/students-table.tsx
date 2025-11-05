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
import { Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";


interface StudentsTableProps {
    students: Student[];
    onEditStudent: (student: Student) => void;
}

export function StudentsTable({ students, onEditStudent }: StudentsTableProps) {
    
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
                <CardDescription>A list of all registered students in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    {students.length === 0 && <TableCaption>No students have been added yet.</TableCaption>}
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Register No.</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Enrolled On</TableHead>
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
                            {new Date(student.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEditStudent(student)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
