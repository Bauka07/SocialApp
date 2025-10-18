package config

var jwtKey = []byte("BaukaGOI")

func GetJWT() []byte {
	keyCopy := make([]byte, len(jwtKey))
	copy(keyCopy, jwtKey)
	return keyCopy
}
