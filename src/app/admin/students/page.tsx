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
import { PlusCircle } from "lucide-react";
import { AddStudentForm } from "@/components/admin/add-student-form";
import { StudentsTable } from "@/components/admin/students-table";
import { Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function StudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = React.useState<Student[]>(() => {
    if (typeof window !== 'undefined') {
      const savedStudents = localStorage.getItem('students');
      return savedStudents ? JSON.parse(savedStudents) : [];
    }
    return [];
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [studentToDelete, setStudentToDelete] = React.useState<Student | null>(null);

  const handleStudentAdded = (newStudent: Student) => {
    setStudents(prevStudents => {
      const updatedStudents = [...prevStudents, newStudent];
      if (typeof window !== 'undefined') {
        localStorage.setItem('students', JSON.stringify(updatedStudents));
      }
      return updatedStudents;
    });
    setIsAddDialogOpen(false); // Close dialog on successful add
  };
  
  const openDeleteDialog = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteStudent = () => {
    if (!studentToDelete) return;

    const updatedStudents = students.filter(
      (student) => student.registerNumber !== studentToDelete.registerNumber
    );
    setStudents(updatedStudents);
    if (typeof window !== 'undefined') {
      localStorage.setItem('students', JSON.stringify(updatedStudents));
    }
    toast({
        title: "Student Deleted",
        description: `${studentToDelete.name} has been removed from the system.`
    })
    setIsDeleteDialogOpen(false);
    setStudentToDelete(null);
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Student Management
          </h1>
          <p className="text-muted-foreground">
            View, add, and manage student records.
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

      <StudentsTable students={students} onDeleteStudent={openDeleteDialog} />

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
