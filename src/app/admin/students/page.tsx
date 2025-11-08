
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
import { Loader2, PlusCircle } from "lucide-react";
import { AddStudentForm } from "@/components/admin/add-student-form";
import { EditStudentForm } from "@/components/admin/edit-student-form";
import { StudentsTable } from "@/components/admin/students-table";
import type { Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useStudents } from '@/hooks/use-students';
import { EnrollFaceDialog } from '@/components/admin/enroll-face-dialog';


export default function StudentsPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { students, loading: studentsLoading, updateStudent } = useStudents();

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = React.useState(false);
  
  const [studentToEdit, setStudentToEdit] = React.useState<Student | null>(null);
  const [studentToEnroll, setStudentToEnroll] = React.useState<Student | null>(null);


  const handleStudentAdded = (newStudent: Student) => {
    setIsAddDialogOpen(false);
    // Automatically open the enroll dialog for the new student
    setStudentToEnroll(newStudent);
    setIsEnrollDialogOpen(true);
  };
  
  const handleStudentUpdated = () => {
    setIsEditDialogOpen(false);
    setStudentToEdit(null);
  };

  const handleFaceEnrolled = async (photoDataUri: string) => {
    if (!studentToEnroll) return;
    try {
      // Optimistically update the UI
      const studentName = studentToEnroll.name;
      setStudentToEnroll(prev => prev ? {...prev, photoURL: photoDataUri} : null);

      await updateStudent(studentToEnroll.registerNumber, { photoURL: photoDataUri });
      
      toast({
        title: "Face Enrolled Successfully",
        description: `A new face has been captured for ${studentName}.`,
      });
    } catch(e: any) {
       toast({
        variant: "destructive",
        title: "Face Enrollment Failed",
        description: e.message || "An unexpected error occurred.",
      });
    } finally {
      setIsEnrollDialogOpen(false);
      setStudentToEnroll(null);
    }
  };

  const openEditDialog = (student: Student) => {
    setStudentToEdit(student);
    setIsEditDialogOpen(true);
  };

  const openEnrollDialog = (student: Student) => {
    setStudentToEnroll(student);
    setIsEnrollDialogOpen(true);
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
                Fill in the details below to enroll a new student. You will then be prompted to enroll their face.
              </DialogDescription>
            </DialogHeader>
            <AddStudentForm onStudentAdded={handleStudentAdded} />
          </DialogContent>
        </Dialog>
      </div>

      <StudentsTable 
        students={departmentStudents} 
        onEditStudent={openEditDialog}
        onEnrollFace={openEnrollDialog}
      />

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
      
      {/* Enroll Face Dialog */}
       <EnrollFaceDialog 
          isOpen={isEnrollDialogOpen} 
          onOpenChange={(isOpen) => {
            setIsEnrollDialogOpen(isOpen);
            if (!isOpen) setStudentToEnroll(null); // Clear student when closing dialog
          }}
          student={studentToEnroll}
          onFaceEnrolled={handleFaceEnrolled}
      />
    </div>
  );
}
