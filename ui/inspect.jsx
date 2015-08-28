var Page = React.createClass({
  getInitialState(){
    return {
      transaction: null
    }
  },
  componentDidMount(){
    var id = this.props.params.id;
    Loader.get('/api/v1/error/transaction/'+id, function(err, transaction){
      this.setState({
        transaction: transaction||false
      });
    }.bind(this));
  },
  render(){
    var id = this.props.params.id;
    var {transaction}=this.state;
    var contents = transaction===false?'Not found!':(transaction?<JSONNode obj={transaction} />:'Loading...');
    return (
      <div>
        <div><h1>Error Transaction {id}</h1></div>
        {contents}
      </div>
    );
  }
});

Pages.register('InspectErrorTransaction', Page);
