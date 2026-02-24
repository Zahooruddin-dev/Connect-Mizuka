function Login(req,res) {
  try {
    
  } catch (error) {
        res.status(500).json('Internal Server Error',error)

  }
}
function Register(req,res) {
  try {
    
  } catch (error) {
    res.status(500).json('Internal Server Error',error)
  }
}
module.exports = {
	Login,
	Register,
};
