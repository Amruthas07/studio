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
import { PlusCircle } from "lucide-react";
import { AddStudentForm } from "@/components/admin/add-student-form";
import { StudentsTable } from "@/components/admin/students-table";
import { Student } from '@/lib/types';

export default function StudentsPage() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleStudentAdded = (newStudent: Student) => {
    setStudents(prevStudents => [...prevStudents, newStudent]);
    setIsDialogOpen(false); // Close dialog on successful add
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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

      <StudentsTable students={students} />
    </div>
  );
}
