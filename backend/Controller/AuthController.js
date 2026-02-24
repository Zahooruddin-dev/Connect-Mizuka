function Login(req, res) {
	try {
		res.status(200).json('sadsadsa Server Error');
	} catch (error) {
		res.status(500).json('Internal Server Error', error);
	}
}
function Register(req, res) {
	try {
    		res.status(200).json('sadsadsa Server Error');

	} catch (error) {
		res.status(500).json('Internal Server Error', error);
	}
}
module.exports = {
	Login,
	Register,
};
