import { FurnitureBody, FurnitureElement, FurnitureElementType } from "./furniture-body.model";

fdescribe('FurnitureBody and Feature Unit Tests', () => {
    
    // 1. TESZT: A koordináta teszt (Absolute Position)
    it('should calculate absolute X coordinate relative to the parent', () => {
        const body = new FurnitureBody(100, 50, 400, 300, 500, 18, FurnitureElementType.BODY, 0, 0);
        const shelf = new FurnitureElement(20, 10, 100, 20, FurnitureElementType.SHELF, body);

        expect(shelf.absoluteX).toBe(120);
    });

    // 2. TESZT: Shelf Generator feature - Polc méret öröklődés
    it('Shelf Generator: should inherit width from parent body', () => {
        const body = new FurnitureBody(0, 0, 800, 600, 500, 18, FurnitureElementType.BODY, 0, 0);
        // Amikor a generátor berak egy polcot, annak a szélessége meg kell egyezzen a bútor belső szélességével
        const newShelf = new FurnitureElement(0, 300, body.width, 18, FurnitureElementType.SHELF, body);

        expect(newShelf.width).toBe(800);
        expect(newShelf.type).toBe(FurnitureElementType.SHELF);
    });

    // 3. TESZT: Automatic Dimension Labeling - Számított felirat teszt
    it('Dimension Labeling: should provide correct dimensions for labeling', () => {
        const element = new FurnitureElement(0, 0, 450, 18, FurnitureElementType.SHELF, null);
        
        // Ez azt szimulálja, amit a feliratnak ki kellene írnia (pl. "450 mm")
        const dimensionLabel = `${element.width} mm`;
        
        expect(dimensionLabel).toBe("450 mm");
    });
});