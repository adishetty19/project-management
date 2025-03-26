import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css']
})
export class AnalyticsDashboardComponent implements AfterViewInit {
  @ViewChild('myChart', { static: false }) myChart!: ElementRef<HTMLCanvasElement>;
  
  chart: any;
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  selectedProject: string = '';
  productivityData: any = null;
  
  deadlineAdherence: number = 100;          
  memberDeadlineAdherence: number = 100;      
  
  notifications$: Observable<any>;
  
  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService
  ) {
    this.taskService.getTasks().subscribe(tasks => {
      if (this.currentUser?.role === 'Manager') {
        this.tasks = tasks;
      } else {
        this.tasks = tasks.filter(task => task.assignedTo === this.currentUser.email);
      }
      this.filteredTasks = this.tasks;
      this.calculateProductiveMetrics();
      this.calculateDeadlineAdherence();
      this.updateChartData();
    });
    this.notifications$ = this.notificationService.getNotifications();
  }
  
  ngAfterViewInit(): void {
    const canvas = this.myChart.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not available.');
      return;
    }
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Completed', 'Pending'],
        datasets: [
          {
            label: 'Tasks',
            data: [
              this.tasks.filter(t => t.status === 'Done').length,
              this.tasks.filter(t => t.status !== 'Done').length
            ],
            backgroundColor: ['rgba(75,192,192,0.6)', 'rgba(255,99,132,0.6)']
          }
        ]
      }
    });
  }
  
  updateChartData(): void {
    if (this.chart) {
      this.chart.data.datasets[0].data = [
        this.tasks.filter(t => t.status === 'Done').length,
        this.tasks.filter(t => t.status !== 'Done').length
      ];
      this.chart.update();
    }
  }
  
  calculateProductiveMetrics(): void {
    if (!this.selectedProject) {
      this.productivityData = null;
      return;
    }
    const projTasks = this.tasks.filter(t => t.project === this.selectedProject);
    const metrics = { total: projTasks.length, done: 0, pending: 0, efficiency: 0 };
    projTasks.forEach(task => {
      if (task.status === 'Done') {
        metrics.done++;
      } else {
        metrics.pending++;
      }
    });
    metrics.efficiency = metrics.total > 0 ? Math.round((metrics.done / metrics.total) * 100) : 0;
    this.productivityData = metrics;
  }
  
  calculateDeadlineAdherence(): void {
    const tasksWithDueDate = this.tasks.filter(t => t.dueDate);
    if (tasksWithDueDate.length === 0) {
      this.deadlineAdherence = 100;
      this.memberDeadlineAdherence = 100;
      return;
    }
    
    const now = new Date();
    let onTimeCount = 0;
    tasksWithDueDate.forEach(task => {
      const due = new Date(task.dueDate!);
      if (due >= now || task.status === 'Done') {
        onTimeCount++;
      }
    });
    const adherence = Math.round((onTimeCount / tasksWithDueDate.length) * 100);
    
    if (this.currentUser?.role === 'Manager') {
      this.deadlineAdherence = adherence;
    } else {
      this.memberDeadlineAdherence = adherence;
    }
  }
  
  exportCSV(): void {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Title,Status,Project,Assigned To,Due Date\n";
    this.tasks.forEach(task => {
      csvContent += `${task.id},${task.title},${task.status},${task.project || ''},${task.assignedTo || ''},${task.dueDate || ''}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tasks_report.csv");
    document.body.appendChild(link);
    link.click();
  }
  
  exportPDF(): void {
    const doc = new jsPDF();
    doc.text("Tasks Report", 10, 10);
    let yPos = 20;
    this.tasks.forEach(task => {
      doc.text(`${task.id} - ${task.title} (${task.status})`, 10, yPos);
      yPos += 10;
    });
    if (this.currentUser?.role === 'Manager') {
      doc.text(`Deadline Adherence: ${this.deadlineAdherence}%`, 10, yPos + 10);
    } else {
      doc.text(`Your Deadline Adherence: ${this.memberDeadlineAdherence}%`, 10, yPos + 10);
    }
    const pdfBlob = doc.output("blob");
    saveAs(pdfBlob, "tasks_report.pdf");
  }
}
