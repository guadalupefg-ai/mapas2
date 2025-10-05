let streets = [];
let blocks = [];
let currentRoute = [];
let streetNames = [];
let intersections = [];
let lastMousePos = null;
let currentStreet = null;

// Nombres de calles inventados
const streetNamePrefixes = ["Calle", "Avenida", "Bulevar", "Paseo", "Camino", "Vía", "Ronda", "Plaza"];
const streetNameSuffixes = [
    "del Sol", "de la Luna", "Principal", "Central", "Norte", "Sur", "Este", "Oeste",
    "Real", "Nueva", "Vieja", "Alta", "Baja", "Grande", "Pequeña", "Larga", "Corta",
    "Ancha", "Angosta", "Verde", "Azul", "Roja", "Amarilla", "Blanca", "Negra",
    "Libertad", "Justicia", "Igualdad", "Paz", "Esperanza", "Unión", "Progreso",
    "Innovación", "Tecnología", "Futuro", "Creatividad", "Arte", "Ciencia", "Sabiduría"
];

function setup() {
    const container = document.getElementById('canvas-container');
    const canvas = createCanvas(700, 500);
    canvas.parent(container);
    
    generateStreetNames();
    generateMap();
    
    // Event listeners para los botones
    document.getElementById('clear-btn').addEventListener('click', clearRoute);
    document.getElementById('new-map-btn').addEventListener('click', generateNewMap);
}

function draw() {
    background(0); // Fondo negro
    
    // Dibujar manzanas (bloques)
    fill(10, 10, 15); // Negro para las manzanas
    noStroke();
    for (let block of blocks) {
        beginShape();
        for (let point of block.points) {
            vertex(point.x, point.y);
        }
        endShape(CLOSE);
    }
    
    // Dibujar calles
    stroke(100); // Gris para las calles
    strokeWeight(5); // Calles más anchas
    for (let street of streets) {
        line(street.x1, street.y1, street.x2, street.y2);
        
        // Mostrar nombre de la calle (fijo, sin parpadeo)
        if (street.name) {
            let midX = (street.x1 + street.x2) / 2;
            let midY = (street.y1 + street.y2) / 2;
            
            push();
            fill(200, 200, 255, 220);
            noStroke();
            textSize(9);
            textAlign(CENTER, CENTER);
            
            // Rotar texto según la orientación de la calle
            let angle = atan2(street.y2 - street.y1, street.x2 - street.x1);
            if (angle > PI/2 || angle < -PI/2) angle += PI;
            
            translate(midX, midY);
            rotate(angle);
            
            // Fondo para mejor legibilidad
            fill(0, 0, 0, 180);
            rect(-textWidth(street.name)/2 - 2, -14, textWidth(street.name) + 4, 16);
            
            fill(200, 200, 255, 220);
            text(street.name, 0, -6);
            pop();
        }
    }
    
    // Dibujar recorrido actual
    if (currentRoute.length > 1) {
        stroke(255, 0, 128); // Magenta
        strokeWeight(3);
        drawingContext.setLineDash([5, 5]); // Línea punteada
        noFill();
        
        beginShape();
        for (let point of currentRoute) {
            vertex(point.x, point.y);
        }
        endShape();
        
        drawingContext.setLineDash([]); // Restaurar línea sólida
        
        // Dibujar puntos en las intersecciones del recorrido
        for (let point of currentRoute) {
            fill(255, 0, 128);
            noStroke();
            ellipse(point.x, point.y, 6, 6);
        }
    }
    
    // Seguir el mouse para crear recorrido
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        let closestIntersection = findClosestIntersection(mouseX, mouseY);
        let nearStreet = findNearStreet(mouseX, mouseY);
        
        if (nearStreet) {
            currentStreet = nearStreet;
            updateCurrentStreetInfo();
        }
        
        if (closestIntersection && nearStreet) {
            // Si es una nueva intersección, añadirla al recorrido
            if (currentRoute.length === 0 || 
                (closestIntersection.x !== currentRoute[currentRoute.length - 1].x || 
                 closestIntersection.y !== currentRoute[currentRoute.length - 1].y)) {
                
                currentRoute.push({
                    x: closestIntersection.x, 
                    y: closestIntersection.y,
                    street: currentStreet
                });
                updateRouteInfo();
            }
        }
        
        // Dibujar cursor
        fill(255, 0, 128, 180);
        noStroke();
        ellipse(mouseX, mouseY, 12, 12);
        
        // Dibujar línea desde el último punto al cursor
        if (currentRoute.length > 0) {
            let lastPoint = currentRoute[currentRoute.length - 1];
            stroke(255, 0, 128, 100);
            strokeWeight(2);
            drawingContext.setLineDash([3, 3]);
            line(lastPoint.x, lastPoint.y, mouseX, mouseY);
            drawingContext.setLineDash([]);
        }
    }
}

function findNearStreet(x, y) {
    let closestStreet = null;
    let minDist = 20; // Radio de detección

    for (let street of streets) {
        let d = distToLine(x, y, street.x1, street.y1, street.x2, street.y2);
        if (d < minDist) {
            minDist = d;
            closestStreet = street;
        }
    }
    
    return closestStreet;
}

function distToLine(px, py, x1, y1, x2, y2) {
    // Calcular distancia desde un punto a un segmento de línea
    let A = px - x1;
    let B = py - y1;
    let C = x2 - x1;
    let D = y2 - y1;

    let dot = A * C + B * D;
    let lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    let dx = px - xx;
    let dy = py - yy;
    return sqrt(dx * dx + dy * dy);
}

function findClosestIntersection(x, y) {
    let closest = null;
    let minDist = 25; // Radio de detección

    for (let intersection of intersections) {
        let d = dist(x, y, intersection.x, intersection.y);
        if (d < minDist) {
            minDist = d;
            closest = intersection;
        }
    }
    
    return closest;
}

function generateStreetNames() {
    streetNames = [];
    for (let prefix of streetNamePrefixes) {
        for (let suffix of streetNameSuffixes) {
            if (random(1) < 0.3) {
                streetNames.push(`${prefix} ${suffix}`);
            }
        }
    }
    
    // Asegurarnos de tener suficientes nombres
    while (streetNames.length < 80) {
        let prefix = random(streetNamePrefixes);
        let suffix = random(streetNameSuffixes);
        let newName = `${prefix} ${suffix}`;
        if (!streetNames.includes(newName)) {
            streetNames.push(newName);
        }
    }
}

function generateMap() {
    streets = [];
    blocks = [];
    intersections = [];
    
    // Crear calles en una cuadrícula más densa
    let horizontalStreets = [];
    let verticalStreets = [];
    
    // Más calles horizontales
    for (let i = 0; i < 10; i++) {
        let y = 40 + i * 45 + random(-15, 15);
        let street = {
            x1: 30, y1: y, 
            x2: width - 30, y2: y,
            name: streetNames.pop() || `Calle H-${i+1}`
        };
        streets.push(street);
        horizontalStreets.push(street);
    }
    
    // Más calles verticales
    for (let i = 0; i < 12; i++) {
        let x = 35 + i * 60 + random(-20, 20);
        let street = {
            x1: x, y1: 35, 
            x2: x, y2: height - 35,
            name: streetNames.pop() || `Avenida V-${i+1}`
        };
        streets.push(street);
        verticalStreets.push(street);
    }
    
    // Calles diagonales adicionales
    for (let i = 0; i < 6; i++) {
        let startX = random(50, width - 150);
        let startY = random(50, height - 150);
        let length = random(120, 250);
        
        // Diagonal hacia abajo-derecha
        streets.push({
            x1: startX, y1: startY,
            x2: startX + length, y2: startY + length,
            name: streetNames.pop() || `Diagonal D-${i+1}`
        });
        
        // Diagonal hacia abajo-izquierda
        streets.push({
            x1: startX, y1: startY,
            x2: startX - length, y2: startY + length,
            name: streetNames.pop() || `Diagonal I-${i+1}`
        });
    }
    
    // Calcular intersecciones
    for (let i = 0; i < streets.length; i++) {
        for (let j = i + 1; j < streets.length; j++) {
            let intersection = calculateIntersection(streets[i], streets[j]);
            if (intersection && 
                intersection.x >= 30 && intersection.x <= width - 30 &&
                intersection.y >= 30 && intersection.y <= height - 30) {
                intersections.push(intersection);
            }
        }
    }
    
    // Crear más manzanas (bloques)
    createBlocks(horizontalStreets, verticalStreets);
}

function createBlocks(horizontalStreets, verticalStreets) {
    blocks = [];
    
    // Ordenar calles
    horizontalStreets.sort((a, b) => a.y1 - b.y1);
    verticalStreets.sort((a, b) => a.x1 - b.x1);
    
    // Crear bloques entre las calles (más bloques debido a más calles)
    for (let h = 0; h < horizontalStreets.length - 1; h++) {
        for (let v = 0; v < verticalStreets.length - 1; v++) {
            let topStreet = horizontalStreets[h];
            let bottomStreet = horizontalStreets[h+1];
            let leftStreet = verticalStreets[v];
            let rightStreet = verticalStreets[v+1];
            
            // Encontrar las cuatro esquinas del bloque
            let topLeft = calculateIntersection(topStreet, leftStreet);
            let topRight = calculateIntersection(topStreet, rightStreet);
            let bottomLeft = calculateIntersection(bottomStreet, leftStreet);
            let bottomRight = calculateIntersection(bottomStreet, rightStreet);
            
            if (topLeft && topRight && bottomLeft && bottomRight) {
                blocks.push({
                    points: [topLeft, topRight, bottomRight, bottomLeft]
                });
            }
        }
    }
}

function calculateIntersection(street1, street2) {
    // Calcular la intersección de dos segmentos de línea
    let x1 = street1.x1, y1 = street1.y1;
    let x2 = street1.x2, y2 = street1.y2;
    let x3 = street2.x1, y3 = street2.y1;
    let x4 = street2.x2, y4 = street2.y2;
    
    let denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (abs(denom) < 0.0001) return null; // Líneas paralelas
    
    let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    let u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1)
        };
    }
    
    return null;
}

function updateRouteInfo() {
    if (currentRoute.length < 2) {
        document.getElementById('route-info').innerHTML = '<div class="route-item">Aún no se ha creado un recorrido.</div>';
        return;
    }
    
    let routeHTML = "";
    
    for (let i = 0; i < currentRoute.length - 1; i++) {
        let start = currentRoute[i];
        let end = currentRoute[i+1];
        
        if (start.street && start.street === end.street) {
            routeHTML += `
                <div class="route-item">
                    <span class="street-name">${start.street.name}</span><br>
                    <span class="coordinates">Desde (${Math.round(start.x)}, ${Math.round(start.y)}) hasta (${Math.round(end.x)}, ${Math.round(end.y)})</span>
                </div>
            `;
        } else {
            routeHTML += `
                <div class="route-item">
                    <span class="coordinates">Cambio de calle: (${Math.round(start.x)}, ${Math.round(start.y)}) → (${Math.round(end.x)}, ${Math.round(end.y)})</span>
                </div>
            `;
        }
    }
    
    document.getElementById('route-info').innerHTML = routeHTML;
    
    // Hacer scroll automático al final
    let routeInfo = document.getElementById('route-info');
    routeInfo.scrollTop = routeInfo.scrollHeight;
}

function updateCurrentStreetInfo() {
    let currentInfo = document.getElementById('current-street-info');
    
    if (!currentInfo) {
        currentInfo = document.createElement('div');
        currentInfo.id = 'current-street-info';
        currentInfo.className = 'current-street';
        document.getElementById('route-info').prepend(currentInfo);
    }
    
    if (currentStreet) {
        currentInfo.innerHTML = `
            <strong>Calle actual:</strong> <span class="street-name">${currentStreet.name}</span>
        `;
    }
}

function clearRoute() {
    currentRoute = [];
    currentStreet = null;
    let currentInfo = document.getElementById('current-street-info');
    if (currentInfo) {
        currentInfo.remove();
    }
    document.getElementById('route-info').innerHTML = '<div class="route-item">Aún no se ha creado un recorrido.</div>';
}

function generateNewMap() {
    generateStreetNames();
    generateMap();
    clearRoute();
}