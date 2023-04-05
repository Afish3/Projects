const input = document.querySelector('#fruit');
const suggestions = document.querySelector('.suggestions ul');
const fruitArr = ['Apple', 'Apricot', 'Avocado 🥑', 'Banana', 'Bilberry', 'Blackberry', 'Blackcurrant', 'Blueberry', 'Boysenberry', 'Currant', 'Cherry', 'Coconut', 'Cranberry', 'Cucumber', 'Custard apple', 'Damson', 'Date', 'Dragonfruit', 'Durian', 'Elderberry', 'Feijoa', 'Fig', 'Gooseberry', 'Grape', 'Raisin', 'Grapefruit', 'Guava', 'Honeyberry', 'Huckleberry', 'Jabuticaba', 'Jackfruit', 'Jambul', 'Juniper berry', 'Kiwifruit', 'Kumquat', 'Lemon', 'Lime', 'Loquat', 'Longan', 'Lychee', 'Mango', 'Mangosteen', 'Marionberry', 'Melon', 'Cantaloupe', 'Honeydew', 'Watermelon', 'Miracle fruit', 'Mulberry', 'Nectarine', 'Nance', 'Olive', 'Orange', 'Clementine', 'Mandarine', 'Tangerine', 'Papaya', 'Passionfruit', 'Peach', 'Pear', 'Persimmon', 'Plantain', 'Plum', 'Pineapple', 'Pomegranate', 'Pomelo', 'Quince', 'Raspberry', 'Salmonberry', 'Rambutan', 'Redcurrant', 'Salak', 'Satsuma', 'Soursop', 'Star fruit', 'Strawberry', 'Tamarillo', 'Tamarind', 'Yuzu'];
const suggSet = new Set();
const fruitSet = new Set(fruitArr);

function search(str) {
	for (let fruit of fruitSet) {
		if(fruit.includes(str) || fruit.toLowerCase().includes(str.toLowerCase())) {
			suggSet.add(fruit);
		} else if(!fruit.includes(str) && !fruit.toLowerCase().includes(str.toLowerCase())){
			if(suggSet.has(fruit)) {
				suggSet.delete(fruit);
			}
		}
	}
}

function delList() {
	while( suggestions.firstChild ){
		suggestions.removeChild( suggestions.firstChild );
	  }
	  suggestions.classList.remove('has-suggestions');
}

function searchHandler(e) {
	if(input.value === '') {
		delList();
		return;
	}
	delList();
	search(input.value); 
	presentSugg();
}

function presentSugg() {
	for (const sugg of suggSet) {
		let newSuggestion = document.createElement('li');
		newSuggestion.innerText = sugg;
		suggestions.append(newSuggestion);
	}
	suggestions.classList.add('has-suggestions');
}

function useSuggestion(e) {
	delList();
	input.value = e.target.innerText;
}

input.addEventListener('keyup', searchHandler);
suggestions.addEventListener('click', useSuggestion);
window.addEventListener('keypress', (e) => {
	if(e.key === "Enter" && suggSet.has(input.value)) window.open(`https://www.google.com/search?q=${input.value}+fruit`, target = `_blank`);
});