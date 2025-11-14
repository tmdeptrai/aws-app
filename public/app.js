const apiBase = '/api'

async function fetchExpenses() {
  const res = await fetch(`${apiBase}/expenses`)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

function formatDate(dt) {
  return new Date(dt).toLocaleString()
}

function renderExpenses(items) {
  const tbody = document.getElementById('expenses-body')
  tbody.innerHTML = ''
  items.forEach(e => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${formatDate(e.datetime)}</td>
      <td>${escapeHtml(e.description)}</td>
      <td>${Number(e.cost).toFixed(2)}</td>
      <td class="actions">
        <button class="btn edit">✎</button>
        <button class="btn delete">✕</button>
      </td>
    `
    tr.querySelector('.edit').addEventListener('click', () => startEdit(e))
    tr.querySelector('.delete').addEventListener('click', () => deleteExpense(e.id))
    tbody.appendChild(tr)
  })
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}

async function reload() {
  try{
    const items = await fetchExpenses()
    renderExpenses(items)
  }catch(e){
    console.error(e)
  }
}

async function createExpense(payload){
  await fetch(`${apiBase}/expenses`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
}

async function updateExpense(id, payload){
  await fetch(`${apiBase}/expenses/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
}

async function deleteExpense(id){
  if(!confirm('Delete this expense?')) return
  await fetch(`${apiBase}/expenses/${id}`, { method: 'DELETE' })
  reload()
}

let editingId = null

function startEdit(expense){
  editingId = expense.id
  document.getElementById('description').value = expense.description
  document.getElementById('cost').value = expense.cost
  document.getElementById('submit-btn').textContent = 'Update'
  document.getElementById('cancel-btn').style.display = 'inline-block'
}

function resetForm(){
  editingId = null
  document.getElementById('expense-form').reset()
  document.getElementById('submit-btn').textContent = 'Add'
  document.getElementById('cancel-btn').style.display = 'none'
}

document.getElementById('expense-form').addEventListener('submit', async (ev) => {
  ev.preventDefault()
  const description = document.getElementById('description').value
  const cost = document.getElementById('cost').value
  // client-side validation
  if (!description || description.trim().length === 0) { alert('Description is required'); return }
  const costNum = Number(cost)
  if (Number.isNaN(costNum) || costNum < 0) { alert('Cost must be a non-negative number'); return }

  if(editingId){
    // send only description and cost; server will preserve datetime
    await updateExpense(editingId, { description, cost })
  } else {
    // on create, set datetime to now
    await createExpense({ datetime: new Date().toISOString(), description, cost })
  }
  resetForm()
  reload()
})

document.getElementById('cancel-btn').addEventListener('click', () => resetForm())

reload()
