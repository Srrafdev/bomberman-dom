package main

import (
	"errors"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/public/", handlePublicFile)
	mux.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
		tmpl, err := template.ParseFiles("../client/index.html")
		if err != nil {
			log.Println(err)
			return
		}
		tmpl.Execute(res, nil)
	})

	fmt.Println("server run ... [http://localhost:8080/]")
	err := http.ListenAndServe(":8080", mux)
	if errors.Is(err, http.ErrServerClosed) {
		fmt.Printf("server closed\n")
	} else if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}

func handlePublicFile(w http.ResponseWriter, r *http.Request) {
	filePath := r.URL.Path[len("/public/"):]
	fullPath := "../client/" + filePath
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		http.Error(w, "404 File not found ----", http.StatusNotFound)
		return
	}
	http.ServeFile(w, r, fullPath)
}

