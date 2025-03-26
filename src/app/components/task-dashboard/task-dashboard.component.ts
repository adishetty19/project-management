import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { Task } from '../../models/task.model';      
import { TaskService } from '../../services/task.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-task-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.css']
})
export class TaskDashboardComponent implements OnInit, AfterViewInit {
  selectedView: 'list' | 'kanban' = 'kanban'; 
  form: FormGroup;
  tasks: Task[] = [];
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];
  
  notifications$!: Observable<any>;
  
  currentUser: any = JSON.parse(localStorage.getItem('currentUser') || 'null');

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [this.currentUser?.role === 'Manager' ? '' : null],
      dueDate: [this.currentUser?.role === 'Manager' ? '' : null],
      project: [this.currentUser?.role === 'Manager' ? '' : null],
      assignedTo: [this.currentUser?.role === 'Manager' ? '' : null],
      status: ['To-Do']
    });
  }

  ngOnInit(): void {
    this.taskService.getTasks().subscribe(tasks => {
      if (this.currentUser?.role === 'Manager') {
        this.tasks = tasks;
      } else {
        this.tasks = tasks.filter(task => task.assignedTo === this.currentUser?.email);
      }
      this.updateLists();
    });
    this.notifications$ = this.notificationService.getNotifications();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  addTask(): void {
    if (this.form.valid) {
      const { title, status, description, dueDate, project, assignedTo } = this.form.value;
      const newTask: Task = {
        id: Date.now(),
        title,
        status,
        description: this.currentUser?.role === 'Manager' ? description : undefined,
        dueDate: this.currentUser?.role === 'Manager' ? dueDate : undefined,
        project: this.currentUser?.role === 'Manager' ? project : undefined,
        assignedTo: this.currentUser?.role === 'Manager' ? assignedTo : this.currentUser?.email
      };
      this.taskService.addTask(newTask);
      this.form.reset({ title: '', status: 'To-Do', description: '', dueDate: '', project: '', assignedTo: '' });
    }
  }

  updateLists(): void {
    this.todoTasks = this.tasks.filter(t => t.status === 'To-Do');
    this.inProgressTasks = this.tasks.filter(t => t.status === 'In Progress');
    this.doneTasks = this.tasks.filter(t => t.status === 'Done');
  }

  updateTaskStatus(task: Task, newStatus: 'To-Do' | 'In Progress' | 'Done'): void {
    if (this.currentUser?.role === 'Member' && task.assignedTo !== this.currentUser.email) {
      alert("You can only update tasks assigned to you.");
      return;
    }
    const updatedTask = { ...task, status: newStatus };
    this.taskService.updateTask(updatedTask);
  }

  deleteTask(task: Task): void {
    if (this.currentUser?.role !== 'Manager') {
      alert("Only Manager can delete tasks.");
      return;
    }
    this.taskService.deleteTask(task.id);
  }

  onDrop(event: CdkDragDrop<Task[]>, newStatus: 'To-Do' | 'In Progress' | 'Done'): void {
    console.log('Drop event:', event, 'New status:', newStatus);
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      const task = event.container.data[event.currentIndex];
      task.status = newStatus;
      this.taskService.updateTask(task);
    }
    this.updateLists();
    this.cdr.detectChanges();
  }

  switchView(view: 'list' | 'kanban'): void {
    this.selectedView = view;
  }

  sendTestNotification(): void {
    this.notificationService.addNotification("Test Notification from Task Dashboard at " + new Date().toLocaleTimeString());
  }
}
