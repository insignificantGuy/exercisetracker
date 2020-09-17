const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const url=bodyParser.urlencoded({ extended: false });

const cors = require('cors');

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://rahul:12345@cluster0.hodfv.mongodb.net/db1?retryWrites=true&w=majority',{ 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

app.use(cors());

app.use(express.static('public'));

const schema=mongoose.Schema;
const exerciseSessionSchema = new schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String
});

const Session = mongoose.model('Session', exerciseSessionSchema);

const userSchema = new schema({
  username: {type: String, required: true},
  log: [exerciseSessionSchema]
});

const User = mongoose.model('User', userSchema)

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', url , (req, res) => {
  let newUser = new User()
  newUser.username=req.body.username
  newUser.save((err,data)=>{
    if(err){
      console.log(err);
    }
    else{
      res.json({username:data.username, _id: data._id});
    }
  })
});

app.get('/api/exercise/users', (req, res) => {

  
  User.find({}, (error, arrayOfUsers) => {
    if(!error){
      res.json(arrayOfUsers)
    }
  })
  
})

app.post('/api/exercise/add', bodyParser.urlencoded({ extended: false }) , (req, res) => {
  
  let newSession = new Session({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date
  })
  
  if(newSession.date === ''){
    newSession.date = new Date().toISOString().substring(0, 10)
  }
  
  User.findByIdAndUpdate(
    req.body.userId,
    {$push : {log: newSession}},
    {new: true},
    (error, updatedUser)=> {
      if(!error){
        let resObject = {}
        resObject['_id'] = updatedUser.id
        resObject['username'] = updatedUser.username
        resObject['date'] = new Date(newSession.date).toDateString()
        resObject['description'] = newSession.description
        resObject['duration'] = newSession.duration
        res.json(resObject)
      }
    }
  )
})

app.get('/api/exercise/log', (req, res) => {
  
  User.findById(req.query.userId, (error, result) => {
    if(!error){
      let resObject = result
      
      if(req.query.from || req.query.to){
        
        let fromDate = new Date(0)
        let toDate = new Date()
        
        if(req.query.from){
          fromDate = new Date(req.query.from)
        }
        
        if(req.query.to){
          toDate = new Date(req.query.to)
        }
        
        fromDate = fromDate.getTime()
        toDate = toDate.getTime()
        
        resObject.log = resObject.log.filter((session) => {
          let sessionDate = new Date(session.date).getTime()
          
          return sessionDate >= fromDate && sessionDate <= toDate
          
        })
        
      }
      
      if(req.query.limit){
        resObject.log = resObject.log.slice(0, req.query.limit)
      }
      
      resObject = resObject.toJSON()
      resObject['count'] = result.log.length
      res.json(resObject)
    }
  })
  
})

const listener = app.listen(3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})