
'use client';
import React from 'react';
import { Loader2, PlusCircle, Search } from "lucide-react";
import { useStudents } from "@/hooks/use-students";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
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
import { AddStudentForm } from "@/components/admin/add-student-form";
import { EditStudentForm } from "@/components/admin/edit-student-form";
import { StudentsTable } from "@/components/admin/students-table";
import { StudentProfileCard } from '@/components/shared/student-profile-card';
import type { Student } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

export default function AdminStudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { students, loading: studentsLoading, deleteStudent } = useStudents();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [studentToEdit, setStudentToEdit] = React.useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = React.useState<Student | null>(null);
  const [studentToView, setStudentToView] = React.useState<Student | null>(null);
  
  const loading = authLoading || studentsLoading;

  const handleAdded = () => setIsAddDialogOpen(false);
  const handleUpdated = () => setIsEditDialogOpen(false);
  const handleDeleted = async () => {
    if (studentToDelete) {
      await deleteStudent(studentToDelete.registerNumber);
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };
  const openViewDialog = (student: Student) => {
    setStudentToView(student);
    setIsViewDialogOpen(true);
  };
  const openEditDialog = (student: Student) => {
    setStudentToEdit(student);
    setIsEditDialogOpen(true);
  };
  const openDeleteDialog = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };
  const filteredStudents = React.useMemo(() => {
    if (!searchTerm) return students;
    return students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.registerNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
         <h1 className="text-3xl font-bold tracking-tight font-headline">
          Student Management
        </h1>
        <p className="text-foreground">
          Add, view, edit, or remove student records.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Search by name or register number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
            />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 shrink-0">
              <PlusCircle className="h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Add New Student</DialogTitle>
              <DialogDescription>
                Fill in the details below to enroll a new student.
              </DialogDescription>
            </DialogHeader>
            <AddStudentForm onStudentAdded={handleAdded} />
          </DialogContent>
        </Dialog>
      </div>

      <StudentsTable 
        students={filteredStudents} 
        onViewStudent={openViewDialog}
        onEditStudent={openEditDialog}
        onDeleteStudent={openDeleteDialog}
      />

      {/* Dialogs */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
              <DialogHeader><DialogTitle className="font-headline text-2xl">Student Profile</DialogTitle></DialogHeader>
              {studentToView && <StudentProfileCard student={studentToView} />}
          </DialogContent>
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                  <DialogTitle className="font-headline text-2xl">Edit Student Details</DialogTitle>
                  <DialogDescription>Update the information for {studentToEdit?.name}.</DialogDescription>
              </DialogHeader>
              {studentToEdit && <EditStudentForm student={studentToEdit} onStudentUpdated={handleUpdated} />}
          </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the record for <span className='font-bold'>{studentToDelete?.name}</span> and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleted} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
