'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search } from "lucide-react";
import { StudentsTable } from "@/components/admin/students-table";
import type { Student } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useStudents } from '@/hooks/use-students';
import { Input } from '@/components/ui/input';
import { StudentProfileCard } from '@/components/shared/student-profile-card';


export default function TeacherStudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { students, loading: studentsLoading } = useStudents();
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [studentToView, setStudentToView] = React.useState<Student | null>(null);

  const openViewDialog = (student: Student) => {
    setStudentToView(student);
    setIsViewDialogOpen(true);
  };
  
  const filteredStudents = React.useMemo(() => {
      if (!user?.department || user.department === 'all') return [];
      
      const departmentStudents = students.filter(student => student.department === user.department);
      
      if (!searchTerm) {
          return departmentStudents;
      }

      return departmentStudents.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registerNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [students, user, searchTerm]);

  if (authLoading || studentsLoading) {
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
          Student Directory
        </h1>
        <p className="text-foreground">
          Search for and view student profiles in the {user?.department.toUpperCase()} department.
        </p>
      </div>

      <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
              placeholder="Search by name or register number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
          />
      </div>

      <StudentsTable 
        students={filteredStudents} 
        onViewStudent={openViewDialog}
        readOnly={true}
      />

       {/* View Student Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                  <DialogTitle className="font-headline text-2xl">Student Profile</DialogTitle>
              </DialogHeader>
              {studentToView && <StudentProfileCard student={studentToView} />}
          </DialogContent>
      </Dialog>
    </div>
  );
}
