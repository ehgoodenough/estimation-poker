function getURLQuery(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]")
    var results = new RegExp("[\\?&]" + name + "=([^&#]*)").exec(location.search)
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "))
}

window.state = new Object()
window.id = Math.random().toString().substring(2, 9)
window.isSpectator = parseInt(getURLQuery("isSpectator"))
window.isModerator = parseInt(getURLQuery("isModerator")) == 1

var host = window.document.location.host.replace(/:.*/, "")
var ws = new WebSocket("ws://" + host + ":8080")
ws.onopen = function() {
    ws.send(JSON.stringify({
        type: "connect",
        data: {
            id: window.id
        }
    }))
}
ws.onmessage = function(event) {
    window.state = JSON.parse(event.data)
    render.setState(window.state)
    // console.log(window.state)
}

class Mount extends React.Component {
    render() {
        if(!!this.state) {
            return (
                <div className="container">
                    <AggregatedEstimationOutput estimates={state.estimates}/>
                    <EstimationProgress estimates={state.estimates}/>
                    <hr/>
                    <EstimationOutput estimates={state.estimates[id]}/>
                    <EstimationInput index={1} label={"Set-up the environment"}/>
                    <EstimationInput index={2} label={"Develop and Integrate"}/>
                    <EstimationInput index={3} label={"Code Review"}/>
                    <EstimationInput index={4} label={"Automation"}/>
                    <EstimationInput index={5} label={"QA"}/>
                    <hr/>
                    {window.isModerator ? (<ModeratorPanel/>) : null}
                    <small>Hello World!</small>
                </div>
            )
        } else {
            return (
                <div/>
            )
        }
    }
}

class EstimationOutput extends React.Component {
    render() {
        return (
            <div>
                <h1>{this.estimate}</h1>
            </div>
        )
    }
    get estimate() {
        return Object.keys(this.props.estimates).reduce((value, index) => {
            return value + this.props.estimates[index]
        }, 0)
    }
}

class EstimationInput extends React.Component {
    render() {
        return (
            <div>
                <label htmlFor={this.props.index}>{this.props.label}</label>
                <input type="text" placeholder="estimate in days"
                    id={this.props.index} style={this.style}
                    onInput={this.onInput.bind(this)}/>
            </div>
        )
    }
    get style() {
        return {
            backgroundColor: this.state && this.state.isNaN ? "#C00" : null
        }
    }
    onInput(event) {
        var value = event.target.value
        if(isNaN(value)) {
            this.setState({
                isNaN: true
            })
            return
        } else {
            this.setState({
                isNaN: false
            })
        }
        ws.send(JSON.stringify({
            type: "update",
            data: {
                id: window.id,
                estimates: {
                    value: parseInt(value),
                    index: this.props.index,
                },
            }
        }))
    }
}

class AggregatedEstimationOutput extends React.Component {
    render() {
        return (
            <div>
                <h1>{this.estimate}</h1>
            </div>
        )
    }
    get estimate() {
        var estimate = [1, 2, 3, 4, 5].reduce((estimate, label) => {
            return estimate + Object.keys(this.props.estimates).reduce((average, id) => {
                return average + this.props.estimates[id][label]
            }, 0) / Object.keys(this.props.estimates).length
        }, 0)
        return !isNaN(estimate) ? estimate.toFixed(1) : "?"
    }
}

class EstimationProgress extends React.Component {
    render() {
        return (
            <div style={this.style}>
                {Object.keys(this.props.estimates).map((key) => {
                    return (
                        <EstimationProgressNode key={key}
                            estimates={this.props.estimates[key]}/>
                    )
                })}
            </div>
        )
    }
    get style() {
        return {
            textAlign: "center"
        }
    }
}

class EstimationProgressNode extends React.Component {
    render() {
        return (
            <span style={this.style}/>
        )
    }
    get style() {
        return {
            width: "1em",
            height: "1em",
            marginLeft: "0.25em",
            display: "inline-block",
            backgroundColor: this.progress() == 1 ? "#0C0" : "#C00"
        }
    }
    progress() {
        return Object.keys(this.props.estimates).length / 5
    }
}

class ModeratorPanel extends React.Component {
    render() {
        return (
            <div>
                <button onClick={this.onClick}>
                    Clear?
                </button>
            </div>
        )
    }
    onClick(event) {
        var confirmed = window.confirm("This will clear all estimates! Are you sure?")
        if(confirmed) {
            ws.send(JSON.stringify({
                type: "clear"
            }))
        }
    }
}

var render = ReactDOM.render(<Mount/>, document.getElementById("mount"))

// get comprehensive list for estimate inputs
// add spectators
// host it
