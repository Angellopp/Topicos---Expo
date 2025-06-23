// Estado global de la aplicación
const appState = {
    executionCount: 0,
    totalExecutionTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errorCount: 0,
    cache: new Map(),
    performanceData: []
};

// Configuración del gráfico de performance
const ctx = document.getElementById('performanceChart').getContext('2d');
const performanceChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Tiempo de Ejecución (ms)',
            data: [],
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Tiempo (ms)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Ejecuciones'
                }
            }
        }
    }
});

// Funciones de simulación AOP
function simulateAOPExecution(methodName, duration, success = true, cached = false) {
    const startTime = Date.now();
    
    // Log de inicio
    addLog(`Ejecutando: ${methodName}`, 'info');
    
    // Simular ejecución
    setTimeout(() => {
        const executionTime = duration;
        
        // Actualizar métricas
        appState.executionCount++;
        appState.totalExecutionTime += executionTime;
        
        if (cached) {
            appState.cacheHits++;
            addLog(`Cache hit para ${methodName} - Tiempo: ${executionTime}ms`, 'success');
        } else {
            appState.cacheMisses++;
            if (executionTime > 100) {
                addLog(`${methodName} tardó ${executionTime}ms (umbral: 100ms)`, 'warning');
            }
        }
        
        if (!success) {
            appState.errorCount++;
            addLog(`Error en ${methodName}: Operación fallida`, 'error');
        } else {
            addLog(`Completado: ${methodName} - Resultado exitoso`, 'success');
        }
        
        // Actualizar gráfico
        updatePerformanceChart(executionTime);
        
        // Actualizar métricas UI
        updateMetrics();
        
    }, Math.min(duration, 100)); // Simular hasta 100ms para UX
}

function executeProcessData() {
    const cacheKey = 'process_data_[1,2,3,4]_3';
    const isCached = appState.cache.has(cacheKey);
    
    if (!isCached) {
        // Cache MISS - ejecutar y cachear
        addLog('Cache miss - Ejecutando función y guardando resultado', 'info');
        appState.cache.set(cacheKey, { 
            result: '[3, 6, 9, 12]', 
            timestamp: Date.now(),
            method: 'process_data'
        });
        simulateAOPExecution('BusinessService.process_data', 120, true, false);
        updateCacheDisplay();
    } else {
        // Cache HIT - usar resultado cacheado
        addLog('Cache hit - Usando resultado cacheado', 'success');
        simulateAOPExecution('BusinessService.process_data', 15, true, true);
    }
}

function executeCalculateAverage() {
    const inputs = [
        { key: 'calc_avg_[10,20,30]', params: '[10,20,30]', result: '20.0' },
        { key: 'calc_avg_[5,15,25]', params: '[5,15,25]', result: '15.0' },
        { key: 'calc_avg_[100,200]', params: '[100,200]', result: '150.0' }
    ];
    
    const randomInput = inputs[Math.floor(Math.random() * inputs.length)];
    const isCached = appState.cache.has(randomInput.key);
    
    if (!isCached) {
        // Cachear resultado si no existe
        appState.cache.set(randomInput.key, {
            result: randomInput.result,
            timestamp: Date.now(),
            method: 'calculate_average'
        });
        addLog(`Cache miss - Calculando promedio para ${randomInput.params}`, 'info');
        simulateAOPExecution('BusinessService.calculate_average', 45, true, false);
        updateCacheDisplay();
    } else {
        addLog(`Cache hit - Promedio ya calculado para ${randomInput.params}`, 'success');
        simulateAOPExecution('BusinessService.calculate_average', 8, true, true);
    }
}

function executeErrorDemo() {
    addLog('Ejecutando: BusinessService.calculate_average con parámetros: ([])', 'info');
    
    // Simular 3 intentos con retry
    let attempts = 0;
    const retryInterval = setInterval(() => {
        attempts++;
        if (attempts <= 2) {
            addLog(`calculate_average falló (intento ${attempts}/3), reintentando en ${attempts}.0s: Lista vacía`, 'warning');
        } else {
            addLog('calculate_average falló después de 2 intentos', 'error');
            appState.errorCount++;
            updateMetrics();
            clearInterval(retryInterval);
        }
    }, 1000);
}

function executeSlowOperation() {
    const operations = [
        { key: 'slow_op_0.3s', duration: 180, param: '0.3s' },
        { key: 'slow_op_0.5s', duration: 250, param: '0.5s' },
        { key: 'slow_op_1.0s', duration: 400, param: '1.0s' }
    ];
    
    const randomOp = operations[Math.floor(Math.random() * operations.length)];
    const isCached = appState.cache.has(randomOp.key);
    
    if (!isCached) {
        appState.cache.set(randomOp.key, {
            result: `Operación completada en ${randomOp.param}`,
            timestamp: Date.now(),
            method: 'slow_operation'
        });
        addLog(`Cache miss - Ejecutando operación lenta (${randomOp.param})`, 'info');
        simulateAOPExecution('BusinessService.slow_operation', randomOp.duration, true, false);
        updateCacheDisplay();
    } else {
        addLog(`Cache hit - Operación lenta ya ejecutada (${randomOp.param})`, 'success');
        simulateAOPExecution('BusinessService.slow_operation', 12, true, true);
    }
}

function clearCache() {
    appState.cache.clear();
    appState.cacheHits = 0;
    appState.cacheMisses = 0;
    addLog('Cache limpiado - Todos los elementos eliminados', 'info');
    updateCacheDisplay();
    updateMetrics();
}

function clearLogs() {
    document.getElementById('logContainer').innerHTML = '';
    addLog('Logs limpiados - Sistema reiniciado', 'info');
}

// Funciones de UI
function addLog(message, type) {
    const logContainer = document.getElementById('logContainer');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    const typeLabel = type.toUpperCase();
    logEntry.innerHTML = `<strong>[${typeLabel}]</strong> ${timestamp} - ${message}`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function updateMetrics() {
    document.getElementById('totalExecutions').textContent = appState.executionCount;
    document.getElementById('avgExecutionTime').textContent = 
        appState.executionCount > 0 ? 
        Math.round(appState.totalExecutionTime / appState.executionCount) + 'ms' : '0ms';
    document.getElementById('cacheHits').textContent = appState.cacheHits;
    document.getElementById('errorCount').textContent = appState.errorCount;
}

function updatePerformanceChart(executionTime) {
    const chart = performanceChart;
    const dataLength = chart.data.labels.length;
    
    chart.data.labels.push(`Exec ${dataLength + 1}`);
    chart.data.datasets[0].data.push(executionTime);
    
    // Mantener solo los últimos 10 puntos
    if (chart.data.labels.length > 10) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    
    chart.update();
}

function updateCacheDisplay() {
    const cacheContainer = document.getElementById('cacheEntries');
    const cacheIndicator = document.getElementById('cacheIndicator');
    const cacheStatus = document.getElementById('cacheStatus');
    
    if (appState.cache.size === 0) {
        cacheContainer.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">No hay elementos en cache</p>';
        cacheIndicator.style.background = '#ccc';
        cacheStatus.textContent = 'Vacío';
    } else {
        let html = '<div style="font-size: 12px;">';
        let index = 1;
        appState.cache.forEach((value, key) => {
            const age = Math.round((Date.now() - value.timestamp) / 1000);
            const shortKey = key.length > 30 ? key.substring(0, 30) + '...' : key;
            
            // Diferentes colores según la edad del cache
            let borderColor = '#4caf50'; // Verde para nuevo
            let bgColor = '#e8f5e8';
            
            if (age > 30) {
                borderColor = '#ff9800'; // Naranja para medio
                bgColor = '#fff3e0';
            }
            if (age > 60) {
                borderColor = '#f44336'; // Rojo para viejo
                bgColor = '#ffebee';
            }
            
            html += `
                <div style="background: ${bgColor}; padding: 8px; margin: 5px 0; border-radius: 4px; border-left: 3px solid ${borderColor};">
                    <strong>#${index}</strong> ${value.method}<br>
                    <small style="color: #666;">Key: ${shortKey}</small><br>
                    <small style="color: #666;">Edad: ${age}s | TTL: ${Math.max(0, 60-age)}s restantes</small>
                </div>
            `;
            index++;
        });
        html += '</div>';
        cacheContainer.innerHTML = html;
        
        // Indicador de estado
        cacheIndicator.style.background = '#4caf50';
        cacheStatus.textContent = `Activo (${appState.cache.size} elementos)`;
    }
}

// Simulación de TTL del cache - limpiar elementos viejos cada 10 segundos
setInterval(() => {
    const now = Date.now();
    let removedCount = 0;
    
    appState.cache.forEach((value, key) => {
        const age = (now - value.timestamp) / 1000;
        if (age > 60) { // TTL de 60 segundos
            appState.cache.delete(key);
            removedCount++;
        }
    });
    
    if (removedCount > 0) {
        addLog(`TTL expirado - ${removedCount} elemento(s) removido(s) del cache`, 'warning');
        updateCacheDisplay();
    }
}, 10000);

// Simulación automática cada 30 segundos
setInterval(() => {
    const randomAction = Math.random();
    if (randomAction < 0.4) {
        executeProcessData();
    } else if (randomAction < 0.7) {
        executeCalculateAverage();
    } else {
        executeSlowOperation();
    }
}, 30000);

// Inicialización
updateMetrics();
updateCacheDisplay();