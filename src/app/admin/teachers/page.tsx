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
import { Loader2, PlusCircle, Search } from "lucide-react";
import { AddTeacherForm } from "@/components/admin/add-teacher-form";
import { TeachersTable } from "@/components/admin/teachers-table";
import { useAuth } from '@/hooks/use-auth';
import { useTeachers } from '@/hooks/use-teachers';
import { Input } from '@/components/ui/input';

export default function TeachersPage() {
  const { user, loading: authLoading } = useAuth();
  const { teachers, loading: teachersLoading } = useTeachers();
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  
  const handleTeacherAdded = () => {
    setIsAddDialogOpen(false);
  };
  
  const filteredTeachers = React.useMemo(() => {
      if (!searchTerm) {
          return teachers;
      }
      return teachers.filter(teacher => 
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [teachers, searchTerm]);

  if (authLoading || teachersLoading) {
      return (
          <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Teacher Management
          </h1>
          <p className="text-foreground">
            View, add, and manage teacher records.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
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

      <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
          />
      </div>

      <TeachersTable 
        teachers={filteredTeachers} 
      />
    </div>
  );
}
