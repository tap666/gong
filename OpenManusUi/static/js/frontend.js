let eventSource = null;
let cur_task_id = null

async function executePrompt() {
    // 收集所有配置参数
    const config = {
        deploy_type: document.getElementById('deployType').value,
        model_name: getSelectedModel(),
        api_key: document.querySelector('#cloudConfig input[type="password"]').value,
        prompt: document.getElementById('input').value
    };

    // 启动任务
    const { task_id } = await fetch('/execute', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(config)
    }).then(res => res.json());
    cur_task_id = task_id
    // 连接流式端点
    const outputDiv = document.getElementById('output');
    eventSource = new EventSource(`/stream/${task_id}`);

    eventSource.onmessage = (e) => {
        const jsonStr = e.data.replace(/^data:/, '')
        const data = JSON.parse(jsonStr);
        outputDiv.innerHTML += `<div>${data.content}</div>`;
        outputDiv.scrollTop = outputDiv.scrollHeight;
    };

    eventSource.onerror = () => {
        eventSource.close();
        outputDiv.innerHTML += '<div style="color:red">连接中断</div>';
    };
}

function stopExecution() {
    if (eventSource) {
        eventSource.close();
        fetch(`/stop/`+cur_task_id, { method: 'POST' });
        console.log("stop")
        eventSource = null;
    }
}

// 获取当前选择的模型名称
function getSelectedModel() {
    if (document.getElementById('deployType').value === 'local') {
        return document.querySelector('#localModels select').value;
    }
    return document.querySelector('#cloudConfig select').value;
}