var admin = require("firebase-admin");

var serviceAccount = require("./firestore-sdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "jackpot-b4a0d"
});

const db = admin.firestore();


const generateGameId = async ()=>{
 	try{
 		const game_id = await db.collection('ids').doc('game_id')
 		.update({
 			id: admin.firestore.FieldValue.increment(1)
 		})
 		.then(()=>{
 			return db.collection('ids').doc('game_id').get()
 		})
 		.then(doc=>{
 			return doc.data().id
 		})
 		return game_id
	}
	catch(e){
			console.log(e)
	}
}

const calculateWinPrize = (selected,result,amount)=>{
	let prize = 0
	if(selected == 'green'){
		if(result == 1 || result == 3 || result == 7 || result == 9)
			prize = amount*2
		else if(result == 5)
			prize = amount*1.5
	}
	else if(selected == 'red'){
		if(result == 2 || result == 4 || result == 6 || result == 8)
			prize = amount*2
		else if(result == 0)
			prize = amount*1.5
	}
	else if(selected == 'violet'){
		if(result == 0 || result == 5)
			prize = amount*4.5
	}
	else{
		if(selected == result)
			prize = amount*9
	}
	return prize
}


const createGame = async ()=>{

	let loni_id = await generateGameId()
	//  let parity_id = await generateGameId()
	//  let sapre_id = await generateGameId()

	let loni_result = (Math.floor(Math.random() * (9 - 0 + 1)) + 0)
	console.log("result:"+loni_result);
	let parity_result = (Math.floor(Math.random() * (9 - 0 + 1)) + 0)
	let sapre_result = (Math.floor(Math.random() * (9 - 0 + 1)) + 0)
	

	const minute = 3
	const gameInstances = db.collection('gameInstances');

	await gameInstances.doc('loni').set({
		id: loni_id,
		createdAt: (new Date().getTime()+ (minute * 60000) ),
		result: loni_result,
		"green":0,
		"red":0,
		"violet":0,
		"0":0,
		"1":0,
		"2":0,
		"3":0,
		"4":0,
		"5":0,
		"6":0,
		"7":0,
		"8":0,
		"9":0,
		"result_number":-1


	});
	// await gameInstances.doc('parity').set({
	// 	id:parity_id,
	// 	createdAt: (new Date().getTime()+ (minute * 60000) ),
	// 	result:parity_result ,
	// 	"green":0,
	// 	"red":0,
	// 	"violet":0,
	// 	"0":0,
	// 	"1":0,
	// 	"2":0,
	// 	"3":0,
	// 	"4":0,
	// 	"5":0,
	// 	"6":0,
	// 	"7":0,
	// 	"8":0,
	// 	"9":0,
	// 	"result_number":-1


	// });
	// await gameInstances.doc('sapre').set({
	// 	id:sapre_id,
	// 	createdAt: (new Date().getTime()+ (minute * 60000) ),
	// 	result:sapre_result ,
	// 	"green":0,
	// 	"red":0,
	// 	"violet":0,
	// 	"0":0,
	// 	"1":0,
	// 	"2":0,
	// 	"3":0,
	// 	"4":0,
	// 	"5":0,
	// 	"6":0,
	// 	"7":0,
	// 	"8":0,
	// 	"9":0,
	// 	"result_number":-1


	// });

	
	

} 


const processResult = async(game_type)=>{
var automaticFlag=false;
let lowerData = await db.collection('appData').doc("lowerSetting").get()
	.then(snap=>{
		return snap.data()
	})

	

	const gameInstances = db.collection('gameInstances');
	let game = await gameInstances.doc(game_type).get()
	.then(snap=>{
		return snap.data()
	})
	game.type = game_type
	
       var game_result=await calculateLowerBit(game.green,game.red,game.violet,game['0'],
	 game['1'],game['2'], game['3'], game['4'], 
	 game['5'],game['6'], game['7'], game['8'], 
	 game['9']
	   )
	   console.log("game:"+game_result)
	   if(game.result_number!=-1)
	   game_result=game.result_number
	   console.log("manual:"+game_result)
   


	let total_win = 0
	let total_bet = 0

	await db.collection('bets').where('game_id','==',game.id).get()
	.then(snap=>{
		
		if(lowerData.numberValue <= snap.size)
		{
			automaticFlag=true
		}
		else{
			automaticFlag=false
		}
		if(game.result_number!=-1)
		automaticFlag=true;
		console.log("auto:"+automaticFlag)
		
		
		if(!automaticFlag)
		{
		
		snap.forEach((doc) => {
			const id = doc.id
			const data = doc.data()
			total_bet+=data.bet_amount
			let taxAmount=data.bet_amount*0.05
			const winPrize = calculateWinPrize(data.bet_value,data.result,data.bet_amount-taxAmount)
			if(winPrize>0){
				total_win+=winPrize
				db.collection('users').doc(data.user_id+'')
				.update({
					balance: admin.firestore.FieldValue.increment(winPrize)
				})
				doc.ref.update({
					isWinner: true,
					win_amount: winPrize,
				})
			}
			doc.ref.update({status: false})
		}
		
		
		);
	}
	else{

		snap.forEach((doc) => {
			const id = doc.id
			const data = doc.data()
			total_bet+=data.bet_amount
			let taxAmount=data.bet_amount*0.05
			const winPrize = calculateWinPrize(data.bet_value,game_result,data.bet_amount-taxAmount)
			if(winPrize>0){
				total_win+=winPrize
				db.collection('users').doc(data.user_id+'')
				.update({
					balance: admin.firestore.FieldValue.increment(winPrize)
				})
				doc.ref.update({
					isWinner: true,
					win_amount: winPrize,
				})
			}
			doc.ref.update({status: false,result:game_result})
		}
		
		
		);	
	}
	})
	game.prize = total_win
	game.bet = total_bet
	if(automaticFlag){
		game.result=game_result
	}
	await db.collection('gameHistory').doc(game.id+'').set(game)

}


const main = async ()=>{
	await processResult('loni')
	//  await processResult('parity')
	// await processResult('sapre')
	// // await processResult('bcone')
	createGame()
}


const calculateLowerBit=async (green_color,red_color,violet_color,num_0,num_1,num_2,num_3,num_4,num_5,num_6,num_7,num_8,num_9)=>{
	let result=0;
		if(green_color<=red_color )
		{
			//green smallest
			if(num_1<=num_3 && num_1<=num_7 && num_1<=num_9 && num_1<=num_5 )
			{
				result=1
			}
			else if(num_3<=num_1 && num_3<=num_7 &&  num_3<=num_9 && num_3<=num_5 )
			{
				result=3
			}
			else if(num_7<=num_1 && num_7<=num_3 &&  num_7<=num_9 && num_7<=num_5 )
	{
	result=7;
	}
	
	else if(num_5<=num_1 && num_5<=num_3 &&  num_5<=num_9 && num_5<=num_7)
	{
		result=5;
	}
	else {
		result=9;
	}
			
	
	
		}
	
	else
		{
			if(num_0<=num_2 && num_0<=num_4 && num_0<=num_6 && num_0<=num_8 )
			{
				result=0
			}
		else if(num_2<=num_0 && num_2<=num_4 && num_2<=num_6 && num_0<=num_8 )
			{
				result=2
			}
			else if(num_4<=num_0 && num_4<=num_2 && num_4<=num_6 && num_4<=num_8 )
			{
				result=4
			}
			else if(num_6<=num_2 && num_6<=num_4 && num_6<=num_8 )
	{
	result=6
	}
	else {
		result=8;
	}
		
	
	}
		return result
	}
main()
