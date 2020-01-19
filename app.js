var express = require("express");
	app = express();
	mongoose = require("mongoose");
	bodyParser = require("body-parser");
	expressSanitizer = require("express-sanitizer");
	methodOverride = require("method-override");
	rn = require("random-number");
	sendOtp = require("sendotp");
	request = require("request");

	mongoose.connect("mongodb+srv://sand123:sand123@cluster0-t0jwv.gcp.mongodb.net/atii3?retryWrites=true&w=majority", { useNewUrlParser: true });


var options = {
	min : 1000,
	max : 9999,
	integer : true
};


var sendOTP = new sendOtp('257761A5H6VOnMsE0i5e089b48P1');
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer()); 
app.use(methodOverride("_method"));
app.set("view engine","ejs");
mongoose.set("useFindAndModify", false);


var otpSchema = mongoose.Schema({
	otp : Number,
	mobile : {type : Number, unique : true}
});
var Otp = mongoose.model("Otp",otpSchema);

var userSchema = mongoose.Schema({
	fname : String,
	lname : String,
	mobile : {type : Number, unique : true},
});
var User = mongoose.model("User",userSchema);


app.get("/", function(req,res){
	res.redirect("/verify");
});

app.get("/verify", function(req,res){
	res.render("page");
});

app.get("/verify/mobile", function(req,res){
	var otp = rn(options);
	var number = parseInt(req.query.number);
	console.log(number,typeof number);
	var url = "http://api.msg91.com/api/sendotp.php?authkey=257761A5H6VOnMsE0i5e089b48P1&mobile="+number+"&message=Your%20otp%20is%20"+otp+"&sender=INDSMS&otp="+otp;
	console.log(url);
	request(url, function(err,response,body){
		if(!err && response.statusCode == 200){
			Otp.create({otp : otp,mobile : req.query.number}, function(err,otpData){
				if(err){
					console.log(err);
				}else{
					res.render("otp",{mobile:req.query.number});
				}
			});
		}
	});
});

app.post("/verify", function(req,res){
	var otp = parseInt(req.body.otp);
	Otp.findOne({mobile:req.body.mobile}, function(err,data){
		if(data.otp == otp){
			User.findOne({mobile:req.body.mobile}, function(error,userData){
				if(error){
					console.log(error);
				}else{
					if(userData){
						delOtp(data.mobile);
						res.json(userData);
					}else{
						res.redirect("/register/"+data._id);
					}
				}
			});
		}
	});
});	

function delOtp(mobile){
	Otp.findOneAndRemove({mobile:mobile}, function(err){
		if(err){
			console.log(err);
		}else{
			return true;
		}
	});
}

app.get("/register/:id", function(req,res){
	var id = req.params.id;
	Otp.findById(id, function(err,data){
		if(err){
			console.log(err);
		}else{
			console.log(data);
			res.render("register",{mobile:data.mobile});
		}
	});
});


app.post("/register", function(req,res){
	req.body.user.body = req.sanitize(req.body.user.body);
	User.create(req.body.user, function(err,user){
		if(err){
			console.log(err);
		}else{
			delOtp(user.mobile);
			res.json(user);
		}
	});	
});

app.listen(process.env.PORT,process.env.IP, function(){
	console.log("running");
});
