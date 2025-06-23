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
        appState.cache.set(cacheKey, { result: '[3, 6, 9, 12]', timestamp: Date.now() });
        simulateAOPExecution('BusinessService.process_data', 120, true, false);
    } else {
        simulateAOPExecution('BusinessService.process_data', 15, true, true);
    }
    
    updateCacheDisplay();
}

function executeCalculateAverage() {
    simulateAOPExecution('BusinessService.calculate_average', 45, true, false);
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
    simulateAOPExecution('BusinessService.slow_operation', 180, true, false);
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
    
    if (appState.cache.size === 0) {
        cacheContainer.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">No hay elementos en cache</p>';
    } else {
        let html = '<div style="font-size: 12px;">';
        appState.cache.forEach((value, key) => {
            const age = Math.round((Date.now() - value.timestamp) / 1000);
            html += `
                <div style="background: #e8f5e8; padding: 8px; margin: 5px 0; border-radius: 4px; border-left: 3px solid #4caf50;">
                    <strong>Key:</strong> ${key.substring(0, 40)}...<br>
                    <strong>Edad:</strong> ${age}s
                </div>
            `;
        });
        html += '</div>';
        cacheContainer.innerHTML = html;
    }
}

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