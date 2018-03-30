import React, { Component } from "react";
import "./App.css";
import { initApi } from "./api";
import axios from "axios";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      api: {},
      value: "",
      selectedEmails: []
    };
    this.handleCheckbox = this.handleCheckbox.bind(this);
  }

  componentWillMount() {
    initApi(api => {
      api.window.startAutoResizer();
      this.setState({
        value: api.field.getValue(),
        api: api
      });
    });
    const apiBaseURL = "https://api.contentful.com/spaces";
    axios
      .get(
        `${apiBaseURL}/${process.env.REACT_APP_SPACE}/users?access_token=${
          process.env.REACT_APP_CMA_TOKEN
        }`
      )
      .then(response => {
        let obj1 = {};
        let obj2 = { Admin: [] };
        for (let i = 0; i < response.data.items.length; i++) {
          let item = response.data.items[i];
          obj1[item.sys.id] = {
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
            role: null,
            roleID: null,
            avatar: item.avatarUrl
          };
        }
        this.setState({ users: obj1 }, () => {
          axios
            .get(
              `${apiBaseURL}/${
                process.env.REACT_APP_SPACE
              }/space_memberships?access_token=${
                process.env.REACT_APP_CMA_TOKEN
              }`
            )
            .then(response => {
              Object.keys(this.state.users).forEach(function(uID) {
                for (let i = 0; i < response.data.items.length; i++) {
                  let item = response.data.items[i];
                  if (uID === item.user.sys.id && item.admin === true) {
                    obj1[uID].role = "Admin";
                    obj2.Admin.push({ [uID]: obj1[uID] });
                  }
                  if (uID === item.user.sys.id && item.admin === false) {
                    obj1[uID].roleID = item.roles[0].sys.id;
                  }
                }
              });
              this.setState({ users: obj1, roles: obj2 }, () => {
                axios
                  .get(
                    `${apiBaseURL}/${
                      process.env.REACT_APP_SPACE
                    }/roles?access_token=${process.env.REACT_APP_CMA_TOKEN}`
                  )
                  .then(response => {
                    Object.keys(this.state.users).forEach(function(uID) {
                      for (let i = 0; i < response.data.items.length; i++) {
                        let item = response.data.items[i];
                        if (obj1[uID].roleID === item.sys.id) {
                          if (!Object.keys(obj2).includes(item.name)) {
                            obj1[uID].role = item.name;
                            obj2[item.name] = [{ [uID]: obj1[uID] }];
                          } else {
                            obj1[uID].role = item.name;
                            obj2[item.name].push({ [uID]: obj1[uID] });
                          }
                        }
                      }
                    });
                    this.setState({ users: obj1, roles: obj2 });
                  });
              });
            });
        });
      });
  }

  handleClickUpdate = e => {
    const { api, value } = this.state;
    api.field.setValue(this.state);
  };

  handleCheckbox = e => {
    if (
      e.target.checked &&
      this.state.selectedEmails.indexOf(e.target.value) === -1
    ) {
      this.state.selectedEmails.push(e.target.value);
      console.log(this.state.selectedEmails);
    }
    if (
      !e.target.checked &&
      this.state.selectedEmails.indexOf(e.target.value) !== -1
    ) {
      let index = this.state.selectedEmails.indexOf(e.target.value);
      this.state.selectedEmails.splice(index, 1);
      console.log(this.state.selectedEmails);
    }
  };

  render() {
    const { value } = this.state;
    if (!this.state.users) {
      return <div>loading</div>;
    }

    let users = Object.keys(this.state.users).map((user, idx) => {
      return (
        <div key={idx}>
          <label>
            <input
              type="checkbox"
              id={this.state.users[user].firstName}
              name={this.state.users[user].firstName}
              value={this.state.users[user].email}
              onChange={this.handleCheckbox}
            />
            {this.state.users[user].firstName +
              " " +
              this.state.users[user].lastName}{" "}
            ({this.state.users[user].email}) - {this.state.users[user].role}
          </label>
          <br />
        </div>
      );
    });

    return (
      <div className="App">
        {users}
        <button
          className="update-button cf-btn-primary"
          onClick={this.handleClickUpdate}
        >
          Update
        </button>
      </div>
    );
  }
}

export default App;
