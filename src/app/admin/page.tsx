
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Loader2, PlusCircle, Search, UserCog } from "lucide-react";
import { useStudents } from "@/hooks/use-students";
import { useTeachers } from "@/hooks/use-teachers";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { AddTeacherForm } from "@/components/admin/add-teacher-form";
import { EditTeacherForm } from "@/components/admin/edit-teacher-form";
import { TeachersTable } from "@/components/admin/teachers-table";
import { TeacherProfileCard } from '@/components/shared/teacher-profile-card';
import type { Student, Teacher } from '@/lib/types';


export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { students, loading: studentsLoading, deleteStudent } = useStudents();
  const { teachers, loading: teachersLoading, deleteTeacher } = useTeachers();

  // State for students
  const [studentSearchTerm, setStudentSearchTerm] = React.useState('');
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = React.useState(false);
  const [isEditStudentDialogOpen, setIsEditStudentDialogOpen] = React.useState(false);
  const [isDeleteStudentDialogOpen, setIsDeleteStudentDialogOpen] = React.useState(false);
  const [isViewStudentDialogOpen, setIsViewStudentDialogOpen] = React.useState(false);
  const [studentToEdit, setStudentToEdit] = React.useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = React.useState<Student | null>(null);
  const [studentToView, setStudentToView] = React.useState<Student | null>(null);

  // State for teachers
  const [teacherSearchTerm, setTeacherSearchTerm] = React.useState('');
  const [isAddTeacherDialogOpen, setIsAddTeacherDialogOpen] = React.useState(false);
  const [isEditTeacherDialogOpen, setIsEditTeacherDialogOpen] = React.useState(false);
  const [isDeleteTeacherDialogOpen, setIsDeleteTeacherDialogOpen] = React.useState(false);
  const [isViewTeacherDialogOpen, setIsViewTeacherDialogOpen] = React.useState(false);
  const [teacherToEdit, setTeacherToEdit] = React.useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = React.useState<Teacher | null>(null);
  const [teacherToView, setTeacherToView] = React.useState<Teacher | null>(null);

  const loading = authLoading || studentsLoading || teachersLoading;

  // Handlers for students
  const handleStudentAdded = () => setIsAddStudentDialogOpen(false);
  const handleStudentUpdated = () => setIsEditStudentDialogOpen(false);
  const handleStudentDeleted = async () => {
    if (studentToDelete) {
      await deleteStudent(studentToDelete.registerNumber);
      setIsDeleteStudentDialogOpen(false);
      setStudentToDelete(null);
    }
  };
  const openViewStudentDialog = (student: Student) => {
    setStudentToView(student);
    setIsViewStudentDialogOpen(true);
  };
  const openEditStudentDialog = (student: Student) => {
    setStudentToEdit(student);
    setIsEditStudentDialogOpen(true);
  };
  const openDeleteStudentDialog = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteStudentDialogOpen(true);
  };
  const filteredStudents = React.useMemo(() => {
    if (!studentSearchTerm) return students;
    return students.filter(s => 
      s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      s.registerNumber.toLowerCase().includes(studentSearchTerm.toLowerCase())
    );
  }, [students, studentSearchTerm]);


  // Handlers for teachers
  const handleTeacherAdded = () => setIsAddTeacherDialogOpen(false);
  const handleTeacherUpdated = () => setIsEditTeacherDialogOpen(false);
  const handleTeacherDeleted = async () => {
    if (teacherToDelete) {
      await deleteTeacher(teacherToDelete.teacherId);
      setIsDeleteTeacherDialogOpen(false);
      setTeacherToDelete(null);
    }
  };
  const openViewTeacherDialog = (teacher: Teacher) => {
    setTeacherToView(teacher);
    setIsViewTeacherDialogOpen(true);
  };
  const openEditTeacherDialog = (teacher: Teacher) => {
    setTeacherToEdit(teacher);
    setIsEditTeacherDialogOpen(true);
  };
  const openDeleteTeacherDialog = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setIsDeleteTeacherDialogOpen(true);
  };
  const filteredTeachers = React.useMemo(() => {
    if (!teacherSearchTerm) return teachers;
    return teachers.filter(t => 
      t.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(teacherSearchTerm.toLowerCase())
    );
  }, [teachers, teacherSearchTerm]);

  if (loading || !user) {
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
          Admin Dashboard
        </h1>
        <p className="text-foreground">
          System overview and management tools.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students">Student Management</TabsTrigger>
            <TabsTrigger value="teachers">Teacher Management</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                      placeholder="Search by name or register number..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="pl-10"
                  />
              </div>
              <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
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
                  <AddStudentForm onStudentAdded={handleStudentAdded} />
                </DialogContent>
              </Dialog>
            </div>
            <StudentsTable 
              students={filteredStudents} 
              onViewStudent={openViewStudentDialog}
              onEditStudent={openEditStudentDialog}
              onDeleteStudent={openDeleteStudentDialog}
            />
        </TabsContent>

        <TabsContent value="teachers" className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
               <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                      placeholder="Search by name or email..."
                      value={teacherSearchTerm}
                      onChange={(e) => setTeacherSearchTerm(e.target.value)}
                      className="pl-10"
                  />
              </div>
              <Dialog open={isAddTeacherDialogOpen} onOpenChange={setIsAddTeacherDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1 shrink-0">
                    <PlusCircle className="h-4 w-4" />
                    Add Teacher
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Add New Teacher</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new teacher account.
                    </DialogDescription>
                  </DialogHeader>
                  <AddTeacherForm onTeacherAdded={handleTeacherAdded} />
                </DialogContent>
              </Dialog>
            </div>
            <TeachersTable 
              teachers={filteredTeachers} 
              onViewTeacher={openViewTeacherDialog}
              onEditTeacher={openEditTeacherDialog}
              onDeleteTeacher={openDeleteTeacherDialog}
            />
        </TabsContent>
      </Tabs>


      {/* Student Dialogs */}
      <Dialog open={isViewStudentDialogOpen} onOpenChange={setIsViewStudentDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
              <DialogHeader><DialogTitle className="font-headline text-2xl">Student Profile</DialogTitle></DialogHeader>
              {studentToView && <StudentProfileCard student={studentToView} />}
          </DialogContent>
      </Dialog>
      <Dialog open={isEditStudentDialogOpen} onOpenChange={setIsEditStudentDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                  <DialogTitle className="font-headline text-2xl">Edit Student Details</DialogTitle>
                  <DialogDescription>Update the information for {studentToEdit?.name}.</DialogDescription>
              </DialogHeader>
              {studentToEdit && <EditStudentForm student={studentToEdit} onStudentUpdated={handleStudentUpdated} />}
          </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteStudentDialogOpen} onOpenChange={setIsDeleteStudentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the record for <span className='font-bold'>{studentToDelete?.name}</span> and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStudentDeleted} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Teacher Dialogs */}
      <Dialog open={isViewTeacherDialogOpen} onOpenChange={setIsViewTeacherDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
              <DialogHeader><DialogTitle className="font-headline text-2xl">Teacher Profile</DialogTitle></DialogHeader>
              {teacherToView && <TeacherProfileCard teacher={teacherToView} />}
          </DialogContent>
      </Dialog>
      <Dialog open={isEditTeacherDialogOpen} onOpenChange={setIsEditTeacherDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                  <DialogTitle className="font-headline text-2xl">Edit Teacher Details</DialogTitle>
                  <DialogDescription>Update the information for {teacherToEdit?.name}.</DialogDescription>
              </DialogHeader>
              {teacherToEdit && <EditTeacherForm teacher={teacherToEdit} onTeacherUpdated={handleTeacherUpdated} />}
          </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteTeacherDialogOpen} onOpenChange={setIsDeleteTeacherDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
               This will permanently delete the record for <span className='font-bold'>{teacherToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTeacherDeleted} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    