const mongoClient= require('mongodb').MongoClient
const state ={
    db:null
}
module.exports.connect=function(done){
    //const Password=process.env.tvZwiltv8ylWVSkA
   const url= 'mongodb+srv://Admin-007:tvZwiItv8yIWVSkA@cluster-007.kxziv.mongodb.net/Cluster-007';
    //const url='mongodb://localhost:27017'
    const dbname='shopping'

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })

}

module.exports.get=function(){
    return state.db
}