
'use client';
import React from 'react';
import { Loader2, PlusCircle, Search, TrendingUp, AlertTriangle } from "lucide-react";
import { useStudents } from "@/hooks/use-students";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const departments = [
    { value: 'all', label: 'All Students' },
    { value: 'cs', label: 'Computer Science' },
    { value: 'ce', label: 'Civil Eng.' },
    { value: 'me', label: 'Mechanical Eng.' },
    { value: 'ee', label: 'Electrical Eng.' },
    { value: 'mce', label: 'Mechatronics' },
    { value: 'ec', label: 'Electronics & Comm.' },
];

export default function AdminStudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { students, loading: studentsLoading, deleteStudent, promoteStudents } = useStudents();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = React.useState(false);
  const [isPromoting, setIsPromoting] = React.useState(false);
  
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

  const handlePromoteAll = async () => {
    setIsPromoting(true);
    const result = await promoteStudents(activeTab);
    setIsPromoting(false);
    setIsPromoteDialogOpen(false);
    
    if (!result.success) {
        toast({
            variant: "destructive",
            title: "Promotion Failed",
            description: result.error || "An unexpected error occurred."
        });
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

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeDepartmentLabel = departments.find(d => d.value === activeTab)?.label || 'All Students';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">
            Student Management
            </h1>
            <p className="text-foreground">
            Add, view, edit, or remove student records.
            </p>
        </div>
        <div className="flex items-center gap-2">
            <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Promote Semester
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary font-headline text-2xl">
                            <AlertTriangle className="h-6 w-6 text-orange-500" />
                            Bulk Promotion
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            This will advance <strong>all students</strong> in the <strong>{activeDepartmentLabel}</strong> list to their next semester.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2 my-4 border">
                        <p>• Students in Semester 1 will move to Semester 2.</p>
                        <p>• Students already in Semester 8 will <strong>not</strong> be modified.</p>
                        <p>• This action is permanent and affects the database immediately.</p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setIsPromoteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handlePromoteAll} disabled={isPromoting} className="bg-primary">
                            {isPromoting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Promoting...</> : "Confirm Promotion"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Search by name or register number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
            />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-7 h-auto p-1">
          {departments.map(dept => (
            <TabsTrigger key={dept.value} value={dept.value} className="py-2 text-xs md:text-sm uppercase font-bold tracking-tighter">
                {dept.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {departments.map(dept => {
          const getDepartmentStudents = () => {
            const departmentStudents = dept.value === 'all' 
              ? students 
              : students.filter(s => s.department === dept.value);
            
            if (!searchTerm) return departmentStudents;

            return departmentStudents.filter(s => 
              s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              s.registerNumber.toLowerCase().includes(searchTerm.toLowerCase())
            );
          };
          const departmentStudents = getDepartmentStudents();

          return (
            <TabsContent key={dept.value} value={dept.value} className="mt-4 outline-none">
              <StudentsTable 
                students={departmentStudents} 
                onViewStudent={openViewDialog}
                onEditStudent={openEditDialog}
                onDeleteStudent={openDeleteDialog}
              />
            </TabsContent>
          )
        })}
      </Tabs>

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
