// HTML 요소 가져오기
const carForm = document.querySelector('#carForm')
const makerInput = document.querySelector('#makerInput')
const modelInput = document.querySelector('#modelInput')
const yearInput = document.querySelector('#yearInput')
const mileageInput = document.querySelector('#mileageInput')
const priceInput = document.querySelector('#priceInput')
const fuelInput = document.querySelector('#fuelInput')
const statusInput = document.querySelector('#statusInput')

const submitButton = document.querySelector('#submitButton')
const cancelEditButton = document.querySelector('#cancelEditButton')
const searchInput = document.querySelector('#searchInput')
const statusFilter = document.querySelector('#statusFilter')

const countText = document.querySelector('#countText')
const emptyMessage = document.querySelector('#emptyMessage')
const carList = document.querySelector('#carList')

// 차량 목록 배열이다. 차량 1대는 객체 1개로 저장한다.
let cars = [
  {
    id: 1,
    maker: '현대',
    model: '쏘나타',
    year: 2021,
    mileage: 43000,
    price: 1850,
    fuel: 'LPG',
    status: '판매중',
    image: 'images/현대쏘나타.png',
  },
  {
    id: 2,
    maker: '기아',
    model: 'K5',
    year: 2020,
    mileage: 52000,
    price: 1690,
    fuel: '가솔린',
    status: '예약중',
    image: 'images/기아K5.webp',
  },
]
// null이면 등록 모드, 숫자가 들어 있으면 수정 모드이다.
let editingId = null

// 처음 화면을 열었을 때 차량 목록을 출력한다.
renderCars()

// 차량 목록을 출력
function renderCars() {
  const filteredCars = getFilteredCars()

  // 기존 목록을 비운 뒤 현재 데이터 기준으로 다시 출력한다.
  carList.innerHTML = ''

  emptyMessage.hidden = filteredCars.length > 0
  countText.textContent = `전체 ${cars.length}대 / 표시 ${filteredCars.length}대`

  filteredCars.forEach(function (car) {
    const card = createCarCard(car)
    carList.appendChild(card)
  })
}
// 차량 목록을 필터링
function getFilteredCars() {
  const keyword = searchInput.value.trim().toLowerCase()
  const selectedStatus = statusFilter.value

  return cars.filter(function (car) {
    const searchText = `${car.maker} ${car.model}`.toLowerCase()
    const matchKeyword = searchText.includes(keyword)
    const matchStatus =
      selectedStatus === '전체' || car.status === selectedStatus

    return matchKeyword && matchStatus
  })
}

// 차량 카드 생성
function createCarCard(car) {
  const card = document.createElement('article')
  card.className = 'car-card'

  // 차량 이미지 영역
  let imageArea

  // 차량 데이터에 image 값이 있으면 실제 이미지를 출력
  if (car.image) {
    imageArea = document.createElement('img')
    imageArea.className = 'car-image'
    imageArea.src = car.image
    imageArea.alt = `${car.maker} ${car.model} 차량 이미지`

    // 이미지 파일을 찾지 못하면 이미지 준비중 화면으로 변경
    imageArea.addEventListener('error', function () {
      const placeholder = createImagePlaceholder()
      imageArea.replaceWith(placeholder)
    })
  } else {
    // image 값이 없으면 이미지 준비중 화면 출력
    imageArea = createImagePlaceholder()
  }

  const title = document.createElement('h3')
  title.textContent = `${car.maker} ${car.model}`

  const info = document.createElement('p')
  info.textContent =
    `${car.year}년식 · ${car.fuel} · ${car.mileage.toLocaleString()}km`

  const price = document.createElement('p')
  price.className = 'price'
  price.textContent = `${car.price.toLocaleString()}만원`

  const status = document.createElement('span')
  status.className = `status-badge ${getStatusClass(car.status)}`
  status.textContent = car.status

  const actions = document.createElement('div')
  actions.className = 'card-actions'

  const editButton = document.createElement('button')
  editButton.type = 'button'
  editButton.dataset.action = 'edit'
  editButton.dataset.id = car.id
  editButton.textContent = '수정'

  const deleteButton = document.createElement('button')
  deleteButton.type = 'button'
  deleteButton.className = 'delete-button'
  deleteButton.dataset.action = 'delete'
  deleteButton.dataset.id = car.id
  deleteButton.textContent = '삭제'

  actions.appendChild(editButton)
  actions.appendChild(deleteButton)

  card.appendChild(imageArea)
  card.appendChild(title)
  card.appendChild(info)
  card.appendChild(price)
  card.appendChild(status)
  card.appendChild(actions)

  return card
}

// 이미지가 없을 때 출력할 안내 영역
function createImagePlaceholder() {
  const placeholder = document.createElement('div')
  placeholder.className = 'car-image-placeholder'

  const imageIcon = document.createElement('span')
  imageIcon.className = 'car-image-icon'
  imageIcon.textContent = '🚗'

  const imageText = document.createElement('span')
  imageText.className = 'car-image-text'
  imageText.textContent = '이미지 준비중'

  placeholder.appendChild(imageIcon)
  placeholder.appendChild(imageText)

  return placeholder
}

// 입력 폼을 리셋
function resetForm() {
  editingId = null
  carForm.reset()
  submitButton.textContent = '등록'
  cancelEditButton.hidden = true
  modelInput.focus()
}

// 차량 상태 정보 설정
function getStatusClass(status) {
  if (status === '판매중') {
    return 'selling'
  }

  if (status === '예약중') {
    return 'reserved'
  }

  return 'sold'
}

// 차량 등록 또는 수정 처리
carForm.addEventListener('submit', function (event) {
  event.preventDefault()

  const car = getCarFromForm()

  if (car === null) {
    return
  }

  if (editingId === null) {
    // 등록 모드: 새 id를 만든 뒤 배열에 추가한다.
    car.id = Date.now()
    cars.push(car)
  } else {
    // 수정 모드: 같은 id를 가진 차량만 새 값으로 교체한다.
    cars = cars.map(function (item) {
      if (item.id === editingId) {
        return { ...car, id: editingId }
      }
      return item
    })
  }

  resetForm()
  renderCars()
})

// 차량 카드 안의 수정, 삭제 버튼 처리
carList.addEventListener('click', function (event) {
  const button = event.target.closest('button')

  if (button === null) {
    return
  }

  const action = button.dataset.action
  const id = Number(button.dataset.id)

  if (action === 'edit') {
    startEdit(id)
  }

  if (action === 'delete') {
    deleteCar(id)
  }
})

// 검색어를 입력할 때마다 목록을 다시 그린다.
searchInput.addEventListener('input', renderCars)

// 판매 상태를 바꿀 때마다 목록을 다시 그린다.
statusFilter.addEventListener('change', renderCars)

// 수정 취소
cancelEditButton.addEventListener('click', function () {
  resetForm()
})

// 입력폼에서 차량 정보 가져와서 객체로 반환
function getCarFromForm() {
  const maker = makerInput.value
  const model = modelInput.value.trim()
  const yearText = yearInput.value.trim()
  const mileageText = mileageInput.value.trim()
  const priceText = priceInput.value.trim()
  const fuel = fuelInput.value
  const status = statusInput.value

  const year = Number(yearText)
  const mileage = Number(mileageText)
  const price = Number(priceText)
  const maxYear = new Date().getFullYear()

  if (maker === '') {
    alert('제조사를 선택하세요.')
    makerInput.focus()
    return null
  }

  if (model === '') {
    alert('모델명을 입력하세요.')
    modelInput.focus()
    return null
  }

  if (yearText === '' || year < 1990 || year > maxYear) {
    alert(`연식은 1990년부터 ${maxYear}년 사이로 입력하세요.`)
    yearInput.focus()
    return null
  }

  if (mileageText === '' || mileage < 0) {
    alert('주행거리는 0 이상으로 입력하세요.')
    mileageInput.focus()
    return null
  }

  if (priceText === '' || price <= 0) {
    alert('가격은 1 이상으로 입력하세요.')
    priceInput.focus()
    return null
  }

  if (fuel === '') {
    alert('연료를 선택하세요.')
    fuelInput.focus()
    return null
  }

  return {
    maker,
    model,
    year,
    mileage,
    price,
    fuel,
    status,
  }
}

// 차량 정보 수정 설정
function startEdit(id) {
  const car = cars.find(function (item) {
    return item.id === id
  })

  if (car === undefined) {
    return
  }

  editingId = id

  // 기존 차량 정보를 입력 폼에 채운다.
  makerInput.value = car.maker
  modelInput.value = car.model
  yearInput.value = car.year
  mileageInput.value = car.mileage
  priceInput.value = car.price
  fuelInput.value = car.fuel
  statusInput.value = car.status

  submitButton.textContent = '수정 완료'
  cancelEditButton.hidden = false

  modelInput.focus()
}

// 차량 정보 삭제
function deleteCar(id) {
  const result = confirm('선택한 차량을 삭제할까요?')

  if (result === false) {
    return
  }

  cars = cars.filter(function (car) {
    return car.id !== id
  })

  if (editingId === id) {
    resetForm()
  }

  renderCars()
}
