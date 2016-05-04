var {
  Link,
} = ReactRouter;

var addCommas = function(x) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};
var isNumeric = function (n){
  return !isNaN(parseFloat(n)) && isFinite(n);
};
var escapeHTML = (function(){
  var div = document.createElement('div');
  return function(str){
    div.innerHTML = '';
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };
})();

var ErrorTransactionStatsView = React.createClass({
  render(){
    var props = this.props.stats;
    return (
      <div>
        <h3>{props.title}</h3>
        <div><label>Since:</label> {props.since?new Date(props.since).toLocaleString():''}</div>
        <div><label>Error:</label> {addCommas(props.error)}</div>
      </div>
    );
  }
});

var ErrorTransactionStats = React.createClass({
  getInitialState(){
    return {
      stats: []
    }
  },
  updateState(ErrorTransactions){
    var stats = ErrorTransactions.items();
    this.setState({stats});
  },
  componentDidMount(){
    DataStore.getStore('ErrorTransactionStats', function(err, ErrorTransactions){
      if(err){
        alert(err);
        return console.error(err);
      }
      this.unlisten = ErrorTransactions.listen(()=>this.updateState(ErrorTransactions));
      this.updateState(ErrorTransactions);
    }.bind(this));
  },
  componentWillUnmount(){
    this.unlisten&&this.unlisten();
  },
  render(){
    var now = (new Date()).getTime();
    var blocks = this.props.segments.reduce((blocks, item)=>{
      blocks[item.title] = {
        error: 0,
        title: item.title,
        window: (new Date(now-(1000 * 60 * (item.minutes||1)))).getTime(),
        since: false,
      };
      return blocks;
    }, {});
    var segs = Object.keys(blocks).map((key)=>blocks[key]);

    var grouped = this.state.stats.reduce((accum, item)=>{
      var time = new Date(item.time||item.dateTime).getTime();
      segs.forEach(function(segment){
        if(time>=segment.window){
          segment.error = segment.error+item.stats.error;
          if((!segment.since)||(time<segment.since)){
            segment.since = time;
          }
        }
      });
      return accum;
    }, blocks);
    var stats = Object.keys(grouped).map((key)=>{
      return (
        <div className="col-xl-4 col-lg-4 col-md-4 col-sm-12 col-xs-12" key={key}>
          <ErrorTransactionStatsView stats={grouped[key]} />
        </div>
      );
    });
    return (
      <div className="row">
        {stats}
      </div>
    );
  }
});

Actions.register(ErrorTransactionStats, {role: 'error-transactions-stats'});

var ErrorTransactionsTable = React.createClass({
  getInitialState(){
    return {
      transactions: []
    }
  },
  updateState(ErrorTransactions){
    var transactions = ErrorTransactions.items();
    this.setState({transactions});
  },
  componentDidMount(){
    DataStore.getStore('ErrorTransactions', function(err, ErrorTransactions){
      if(err){
        alert(err);
        return console.error(err);
      }
      this.unlisten = ErrorTransactions.listen(()=>this.updateState(ErrorTransactions));
      this.updateState(ErrorTransactions);
    }.bind(this));
  },
  componentWillUnmount(){
    this.unlisten&&this.unlisten();
  },
  render(){
    var limit = this.props.limit;
    var records = this.state.transactions.reverse();
    if(limit && (records.length > limit)){
      records = records.slice(0, limit);
    }
    var recordRows = records.map((record)=>{
      var errorStyle = record.level>=50?{backgroundColor: 'red', color: 'white'}:{backgroundColor: 'yellow', color: 'black'};
      var details = (record.msg||record.err||JSON.stringify(record.data)||'').replace(/(.{80})/g, '$1\n');
      if(record.url){
        details = <span>{record.url.substr(0,80)}<br />{details}</span>;
      }
      return(
        <tr key={record._id}>
          <td><Link to={"/error/inspect/"+record._id}>{record.hostname}</Link></td>
          <td><Link to={"/error/inspect/"+record._id}>{record.pid}</Link></td>
          <td style={errorStyle}><Link to={"/error/inspect/"+record._id} style={errorStyle}>{record.level}</Link></td>
          <td><Link to={"/error/inspect/"+record._id}>{details}</Link></td>
          <td><Link to={"/error/inspect/"+record._id}>{new Date(record.time||record.dateTime).toLocaleString()}</Link></td>
        </tr>
      );
    });
    return(
      <table className="table table-striped table-condensed">
        <thead>
          <tr>
            <th>Host</th>
            <th>PID</th>
            <th>Level</th>
            <th>Details</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {recordRows}
        </tbody>
      </table>
    );
  }
});

Actions.register(ErrorTransactionsTable, {role: 'error-transactions-table'});
