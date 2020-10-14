package main


import (
	"bytes"
  // "encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
  "io"
	"io/ioutil"
  "os"

  "github.com/pitamonster/nyccovid19data/go/env"
	"github.com/rs/xid"
)


func main() {

	var err error

  err = env.Load()
  if err != nil {
    fmt.Errorf("Bad environment -- %s", err.Error())
    fmt.Printf("Bad environment -- %s", err.Error())
    // return
  }


	// GET https://api.github.com/repos/:owner/:repo/commits?path=FILE_PATH
	filepath := "data-by-modzcta.csv"
  since := "2020-02-28T00:00:00Z" // YYYY-MM-DDTHH:MM:SSZ
	apiUrl := fmt.Sprintf("https://api.github.com/repos/nychealth/coronavirus-data/commits?path=%s&since=%s", filepath, since)
  _, respJsonBytes, err := sendRequest("GET", apiUrl, []byte{}, map[string]string{})
  if err != nil {
  	fmt.Errorf(err.Error())
  }
  // fmt.Print(string(respJsonBytes))
  

  var commits []map[string]interface{}
  err = json.Unmarshal(respJsonBytes, &commits)
  if err != nil {
    fmt.Errorf(err.Error())
  }
  fmt.Printf("Found %d commits",  len(commits))


  for _, commit := range commits {

    sha, _ := commit["sha"].(string)
    // commitMeta := commit["commit"].(map[string]interface{})
    // commitDate := commitMeta["author"].(map[string]interface{})["date"].(string)
    // commitMsg := commitMeta["message"].(string)
    fmt.Printf("%s\n", sha)

  	// Download 
  	// GET https://api.github.com/repos/:owner/:repo/contents/:FILE_PATH?ref=SHA
  	// GET https://raw.githubusercontent.com/:owner/:repo/:sha/:FILE_PATH
  	// fileUrl := fmt.Sprintf("https://raw.githubusercontent.com/nychealth/coronavirus-data/%s/%s", sha, filepath)
  	// localFilepath := getFile(fileUrl, ".csv")
   //  defer os.Remove(localFilepath)
   //  fmt.Printf("%s\n", localFilepath)
    

  	// // Upload
  	// // http PUT https://api.github.com/repos/lee-dohm/test-repo/contents/hello.txt \
	  // // message="my commit message" \
	  // // committer:="{ \"name\": \"Lee Dohm\", \"email\": \"1038121+lee-dohm@users.noreply.github.com\" }" \
	  // // content="bXkgbmV3IGZpbGUgY29udGVudHM="
   //  destFilepath := fmt.Sprintf("data/nychealth-coronavirus-data/data-by-modzcta/%s-data-by-modzcta.csv", commitDate)
   //  apiUrl = fmt.Sprintf("https://%s:%s@api.github.com/repos/pitamonster/nyccovid19data/contents/%s", username, password, destFilepath)
   //  // headers := map[string]string{
   //  //   "Authorization": fmt.Sprintf("token %s", authToken),
   //  // }

   //  var f io.Reader
   //  f, _ = os.Open(localFilepath)
   //  fileContent, _ := ioutil.ReadAll(f)
   //  fileContentEncoded := base64.StdEncoding.EncodeToString(fileContent)

   //  body := map[string]interface{}{
   //    "message": commitMsg,
   //    "content": fileContentEncoded,
   //  }

   //  bodyBytes, err := json.Marshal(body)
   //  if err != nil {
   //    fmt.Errorf(err.Error())
   //  }

  	
  	// _, respJsonBytes, err = sendRequest("PUT", apiUrl, bodyBytes, map[string]string{})
	  // if err != nil {
	  // 	fmt.Errorf(err.Error())
	  // }
   //  fmt.Printf("%s\n", string(respJsonBytes))


    break
  }

}


func sendRequest(method string, url string, body []byte, headers map[string]string) (int, []byte, error) {

  var respBody []byte
  var err error

  req, err := http.NewRequest(method, url, bytes.NewBuffer(body))
  if err != nil {
    return 0, respBody, err
  }

  req.Header.Set("Content-Type", "application/json")
  for k, v := range headers { 
    req.Header.Set(k, v)
  }

  client := http.Client{}
  resp, err := client.Do(req)
  if err != nil {
    return 0, respBody, err
  }
  defer resp.Body.Close()

  fmt.Printf("[%d] %s\n", resp.StatusCode, url)

  respBody, err = ioutil.ReadAll(resp.Body)
  if err != nil {
    return resp.StatusCode, respBody, err
  }
  // fmt.Println(string(respBody))

  return resp.StatusCode, respBody, nil
}


func getFile(url string, fileExtension string) string {

	var localFilepath string

  client := http.Client{}
  req, err := http.NewRequest("GET", url, nil)

  resp, err := client.Do(req)
  if err != nil {
    return ""
  }
  defer resp.Body.Close()


  if resp.StatusCode == http.StatusOK {

    tmpFilename := fmt.Sprintf("%s%s", xid.New().String(), fileExtension)
    localFilepath = tmpFilepathForFilename( tmpFilename )

    out, err := os.Create(localFilepath)
    if err != nil {
      return ""
    }
    defer out.Close()

    _, err = io.Copy(out, resp.Body)
    if err != nil {
      return ""
    }

  }
  

  return localFilepath
}


func tmpFilepathForFilename(filename string) string {
  tmpDir := os.TempDir()
  if os.Getenv("HEROKU_APP_NAME") != "" {
    tmpDir = "/tmp/"
  }

  return fmt.Sprintf("%s%s", tmpDir, filename)
}
