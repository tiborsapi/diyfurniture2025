import { Component, OnInit } from '@angular/core';
import { Body } from '../furnituremodel/furnituremodels';
import { FurnituremodelService } from '../furnituremodel/furnituremodel.service';
import { BomService, FurnitureBackendItem } from '../services/bom.service';
import { BomItem } from '../models/bom.models';

@Component({
    selector: 'app-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.scss'],
    standalone: false
})
export class ProjectComponent implements OnInit {
    private bodies: Body[] = [];
    private selectedBody: number = 0;

    constructor(private furniture: FurnituremodelService, private bom: BomService) {}

    public displayedColumns: string[] = ['id', 'width', 'heigth', 'depth'];
    public dataSource: BomItem[] = [];

    ngOnInit(): void {
        this.loadBomForSelected();
    }

    private loadBomForSelected(): void {
        this.bom.getBomForProject().subscribe(items => {
            this.dataSource = items;
        });
    }
}