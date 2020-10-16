package main


import (
  "bytes"
  // "encoding/base64"
  "encoding/json"
  "fmt"
  "net/http"
  "net/url"
  "io"
  "io/ioutil"
  "os"
  "time"

  "github.com/pitamonster/nyccovid19data/go/env"
)


func main() {

  var err error

  err = env.Load()
  if err != nil {
    fmt.Printf("Bad environment -- %s", err.Error())
    return
  }


  // GET all versions/commits of data-by-modzcta.csv at https://github.com/nychealth/coronavirus-data
  var commits []map[string]interface{}

  // GET https://api.github.com/repos/:owner/:repo/commits?path=FILE_PATH
  dataByModzctaPath := "data-by-modzcta.csv"
  since := time.Date(2020, 5, 18, 0, 0, 0, 0, time.UTC) // YYYY-MM-DDTHH:MM:SSZ
  until := since.Add(time.Hour * 24 * 14)

  params := url.Values{}
  params.Add("path", dataByModzctaPath)
  params.Add("since", since.Format(time.RFC3339))
  params.Add("until", until.Format(time.RFC3339))

  u := &url.URL{
    Scheme:   "https",
    Host:     "api.github.com",
    Path:     "repos/nychealth/coronavirus-data/commits",
    User:     url.UserPassword(env.GithubUsername, env.GithubPassword),
  }


  for {

    params.Set("since", since.Format(time.RFC3339))
    params.Set("until", until.Format(time.RFC3339))
    u.RawQuery = params.Encode()

    _, respBytes, err := sendRequest("GET", u.String(), []byte{}, map[string]string{})
    if err != nil {
      fmt.Print(err.Error())
    }
    // log.Println(string(respBytes))

    var someCommits []map[string]interface{}
    err = json.Unmarshal(respBytes, &someCommits)
    if err != nil {
      fmt.Print(err.Error())
    }
    commits = append(commits, someCommits...)


    since = until
    until = until.Add( time.Hour * 24 * 14 )

    if len(someCommits) == 0 {
      break
    }
  }

  fmt.Printf("Found %d commits\n", len(commits))




  // // GET files already uploaded to api.github.com/repos/pitamonster/nyccovid19data
  // // GET /repos/:owner/:repo/contents/:path
  // // api.github.com/repos/[USER]/[REPO]/git/trees/[BRANCH]?recursive=1
  // u.Path = "repos/pitamonster/nyccovid19data/contents/data/nychealth-coronavirus-data/data-by-modzcta" // Contents API
  // // u.Path = "repos/pitamonster/nyccovid19data/git/trees/main"  // Trees API
  // u.RawQuery = ""

  // _, respBytes, err := sendRequest("GET", u.String(), []byte{}, map[string]string{})
  // if err != nil {
  //   fmt.Errorf(err.Error())
  // }
  // // log.Println(string(respBytes))

  // var files []map[string]interface{}
  // err = json.Unmarshal(respBytes, &files)
  // if err != nil {
  //   fmt.Errorf(err.Error())
  // }
  // fmt.Printf("Found %d files\n", len(files))

  // var filenames []string
  // for _, fileObj := range files {
  //   filename, _ := fileObj["name"].(string)
  //   filenames = append(filenames, filename)
  // }
  



  for _, commit := range commits {

    sha, _ := commit["sha"].(string)
    commitMeta := commit["commit"].(map[string]interface{})
    commitDate := commitMeta["author"].(map[string]interface{})["date"].(string)
    // commitMsg := commitMeta["message"].(string)
    fmt.Printf("%s\n", sha)

    // Download 
    // GET https://api.github.com/repos/:owner/:repo/contents/:FILE_PATH?ref=SHA
    // GET https://raw.githubusercontent.com/:owner/:repo/:sha/:FILE_PATH
    fileUrl := fmt.Sprintf("https://raw.githubusercontent.com/nychealth/coronavirus-data/%s/%s", sha, dataByModzctaPath)
    localFilepath := fmt.Sprintf("%s/data/nychealth-coronavirus-data/data-by-modzcta/%s-data-by-modzcta.csv", env.RootFolderLocalPath, commitDate)
    err = getFile(fileUrl, localFilepath)
    if err != nil {
      fmt.Print(err.Error())
    }
    

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
    //  fmt.Errorf(err.Error())
    // }
   //  fmt.Printf("%s\n", string(respJsonBytes))
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


func getFile(url string, localFilepath string) error {

  client := http.Client{}
  req, err := http.NewRequest("GET", url, nil)

  resp, err := client.Do(req)
  if err != nil {
    return fmt.Errorf("GET file failed -- %s", err.Error())
  }
  defer resp.Body.Close()


  if resp.StatusCode == http.StatusOK {

    out, err := os.Create(localFilepath)
    if err != nil {
      return fmt.Errorf("Create file failed -- %s", err.Error())
    }
    defer out.Close()

    _, err = io.Copy(out, resp.Body)
    if err != nil {
      return fmt.Errorf("Write GET file response to file failed -- %s", err.Error())
    }

  }
  

  return nil
}


func tmpFilepathForFilename(filename string) string {
  tmpDir := os.TempDir()
  if os.Getenv("HEROKU_APP_NAME") != "" {
    tmpDir = "/tmp/"
  }

  return fmt.Sprintf("%s%s", tmpDir, filename)
}
