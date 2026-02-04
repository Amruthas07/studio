
'use client';
import React from 'react';
import { Loader2, PlusCircle, Search } from "lucide-react";
import { useTeachers } from "@/hooks/use-teachers";
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
import { AddTeacherForm } from "@/components/admin/add-teacher-form";
import { EditTeacherForm } from "@/components/admin/edit-teacher-form";
import { TeachersTable } from "@/components/admin/teachers-table";
import { TeacherProfileCard } from '@/components/shared/teacher-profile-card';
import type { Teacher } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

export default function AdminTeachersPage() {
  const { user, loading: authLoading } = useAuth();
  const { teachers, loading: teachersLoading, deleteTeacher } = useTeachers();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [teacherToEdit, setTeacherToEdit] = React.useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = React.useState<Teacher | null>(null);
  const [teacherToView, setTeacherToView] = React.useState<Teacher | null>(null);

  const loading = authLoading || teachersLoading;

  const handleAdded = () => setIsAddDialogOpen(false);
  const handleUpdated = () => setIsEditDialogOpen(false);
  const handleDeleted = async () => {
    if (teacherToDelete) {
      await deleteTeacher(teacherToDelete.teacherId);
      setIsDeleteDialogOpen(false);
      setTeacherToDelete(null);
    }
  };
  const openViewDialog = (teacher: Teacher) => {
    setTeacherToView(teacher);
    setIsViewDialogOpen(true);
  };
  const openEditDialog = (teacher: Teacher) => {
    setTeacherToEdit(teacher);
    setIsEditDialogOpen(true);
  };
  const openDeleteDialog = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setIsDeleteDialogOpen(true);
  };
  const filteredTeachers = React.useMemo(() => {
    if (!searchTerm) return teachers;
    return teachers.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teachers, searchTerm]);

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
          Teacher Management
        </h1>
        <p className="text-foreground">
          Add, view, edit, or remove teacher accounts.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
            />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 shrink-0">
              <PlusCircle className="h-4 w-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Add New Teacher</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new teacher account.
              </DialogDescription>
            </DialogHeader>
            <AddTeacherForm onTeacherAdded={handleAdded} />
          </DialogContent>
        </Dialog>
      </div>

      <TeachersTable 
        teachers={filteredTeachers} 
        onViewTeacher={openViewDialog}
        onEditTeacher={openEditDialog}
        onDeleteTeacher={openDeleteDialog}
      />

      {/* Dialogs */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
              <DialogHeader><DialogTitle className="font-headline text-2xl">Teacher Profile</DialogTitle></DialogHeader>
              {teacherToView && <TeacherProfileCard teacher={teacherToView} />}
          </DialogContent>
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                  <DialogTitle className="font-headline text-2xl">Edit Teacher Details</DialogTitle>
                  <DialogDescription>Update the information for {teacherToEdit?.name}.</DialogDescription>
              </DialogHeader>
              {teacherToEdit && <EditTeacherForm teacher={teacherToEdit} onTeacherUpdated={handleUpdated} />}
          </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will permanently delete the record for <span className='font-bold'>{teacherToDelete?.name}</span>.
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
