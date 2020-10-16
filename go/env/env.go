package env

import (
  "fmt"
  "os"

  "github.com/joho/godotenv"
)


var GithubUsername            string
var GithubPassword            string
var RootFolderLocalPath       string


func Load() error {

  setEnvVarsWithDotEnv()

  GithubUsername = os.Getenv("GITHUB_USERNAME")
  if GithubUsername == "" {
    return fmt.Errorf("GITHUB_USERNAME env var is not set")
  }

  GithubPassword = os.Getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
  if GithubPassword == "" {
    return fmt.Errorf("GITHUB_PERSONAL_ACCESS_TOKEN env var is not set")
  }

  RootFolderLocalPath = os.Getenv("ROOT_FOLDER_LOCAL_PATH")
  if RootFolderLocalPath == "" {
    return fmt.Errorf("ROOT_FOLDER_LOCAL_PATH env var is not set")
  }

  printVars()

  return nil
}


// godotenv WILL NOT OVERRIDE an env variable that already exists -- so ok for dev vars
func setEnvVarsWithDotEnv() error {

  if err := godotenv.Load(); err != nil {
    fmt.Printf("godotenv Load failed -- %s", err.Error())
    return nil // doesn't matter if it fails
  }

  return nil
}


func printVars() {

  fmt.Printf("GITHUB_USERNAME: %v\n", GithubUsername)
  fmt.Printf("GITHUB_PERSONAL_ACCESS_TOKEN: %v\n", GithubPassword)
  fmt.Printf("ROOT_FOLDER_LOCAL_PATH: %v\n", RootFolderLocalPath)
}
