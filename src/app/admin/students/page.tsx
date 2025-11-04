
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, PlusCircle } from "lucide-react";
import { AddStudentForm } from "@/components/admin/add-student-form";
import { EditStudentForm } from "@/components/admin/edit-student-form";
import { StudentsTable } from "@/components/admin/students-table";
import { Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useStudents } from '@/hooks/use-students';

export default function StudentsPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { students, deleteStudent, loading: studentsLoading } = useStudents();

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const [studentToEdit, setStudentToEdit] = React.useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = React.useState<Student | null>(null);

  const handleStudentAdded = () => {
    setIsAddDialogOpen(false);
  };
  
  const handleStudentUpdated = () => {
    setIsEditDialogOpen(false);
    setStudentToEdit(null);
  };

  const openEditDialog = (student: Student) => {
    setStudentToEdit(student);
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
        await deleteStudent(studentToDelete.registerNumber);
        toast({
            title: "Student Deleted",
            description: `${studentToDelete.name} has been removed from the system.`
        })
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: "Deletion Failed",
            description: e.message || "Could not remove the student."
        })
    }
    setIsDeleteDialogOpen(false);
    setStudentToDelete(null);
  };
  
  const departmentStudents = React.useMemo(() => {
      if (!user?.department) return [];
      if (user.department === 'all') return students;
      return students.filter(student => student.department === user.department);
  }, [students, user]);

  if (authLoading || studentsLoading) {
      return (
          <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Student Management
          </h1>
          <p className="text-muted-foreground">
            View, add, and manage student records for the {user?.department.toUpperCase()} department.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Add New Student</DialogTitle>
              <DialogDescription>
                Fill in the details below to enroll a new student. This will create their profile and face data for recognition.
              </DialogDescription>
            </DialogHeader>
            <AddStudentForm onStudentAdded={handleStudentAdded} />
          </DialogContent>
        </Dialog>
      </div>

      <StudentsTable students={departmentStudents} onEditStudent={openEditDialog} onDeleteStudent={openDeleteDialog} />

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                  <DialogTitle className="font-headline text-2xl">Edit Student Details</DialogTitle>
                  <DialogDescription>
                    Update the information for {studentToEdit?.name}. The register number cannot be changed.
                  </DialogDescription>
              </DialogHeader>
              {studentToEdit && <EditStudentForm student={studentToEdit} onStudentUpdated={handleStudentUpdated} />}
          </DialogContent>
      </Dialog>


      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student record for <span className='font-bold'>{studentToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
